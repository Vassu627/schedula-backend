import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Slot } from './slot.entity';
import { UpdateElasticSlotDto } from './dto/update-elasticslot.dto';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
  ) {}

  async getDoctorSlots(doctorId: number) {
    const today = this.formatDate(new Date());

    const slots = await this.slotRepo.find({
      where: {
        doctor: { id: doctorId },
        slotDate: MoreThanOrEqual(today),
      },
      order: {
        slotDate: 'ASC',
        startTime: 'ASC',
      },
    });

    const grouped: Record<string, any[]> = {};

    for (const slot of slots) {
      const isFuture = this.isFutureSlot(slot.slotDate, slot.startTime);

      if (slot.bookedCount >= slot.maxPatients || !isFuture) continue;

      if (!grouped[slot.slotDate]) {
        grouped[slot.slotDate] = [];
      }

      grouped[slot.slotDate].push({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: slot.maxPatients - slot.bookedCount,
        duration: slot.currentDuration || slot.originalDuration,
        reportingTime: this.getReportingTime(
          slot.startTime,
          slot.reportingTime,
        ),
      });
    }

    return grouped;
  }

  async updateElasticSlot(slotId: number, dto: UpdateElasticSlotDto) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['availability', 'doctor'],
    });

    if (!slot) throw new NotFoundException('Slot not found');

    const now = new Date();
    const slotDateTime = this.buildDateTime(slot.slotDate, slot.startTime);

    if (slotDateTime <= now) {
      throw new BadRequestException('Cannot modify past/ongoing slot');
    }

    if (
      dto.newCapacity === undefined &&
      dto.newDuration === undefined &&
      !dto.expandEndTime &&
      !dto.expandStartTime &&
      !dto.shrinkEndTime &&
      !dto.shrinkStartTime
    ) {
      throw new BadRequestException('No changes provided');
    }

    // Capacity update
    if (dto.newCapacity !== undefined) {
      if (slot.bookedCount > dto.newCapacity) {
        throw new BadRequestException(
          'Cannot reduce capacity below booked count',
        );
      }
      slot.maxPatients = dto.newCapacity;
    }

    // Expansion
    if (dto.expandEndTime) {
      return this.expandSlotEndSmart(slot, dto.expandEndTime);
    }

    if (dto.expandStartTime) {
      return this.expandSlotStartSmart(slot, dto.expandStartTime);
    }

    // Shrink
    if (dto.shrinkEndTime) {
      return this.shrinkSlotEndSmart(slot, dto.shrinkEndTime);
    }

    if (dto.shrinkStartTime) {
      return this.shrinkSlotStartSmart(slot, dto.shrinkStartTime);
    }

    // Duration change
    if (dto.newDuration !== undefined) {
      if (!slot.originalDuration) {
        throw new BadRequestException(
          'Duration update not allowed for STREAM slots',
        );
      }

      if (dto.restructure) {
        if (slot.bookedCount > 0) {
          throw new BadRequestException(
            'Cannot restructure slots with existing bookings',
          );
        }

        return this.restructureSlots(slot, dto.newDuration);
      }

      slot.currentDuration = dto.newDuration;
      slot.isElastic = true;
    }

    return this.slotRepo.save(slot);
  }

  // 🔥 EXPAND END
  private async expandSlotEndSmart(slot: Slot, newEndTime: string) {
    const doctorId = slot.doctor.id;
    const slotDate = slot.slotDate;

    const currentEnd = this.timeToMinutes(slot.endTime);
    const requestedEnd = this.timeToMinutes(newEndTime);

    if (requestedEnd <= currentEnd) {
      throw new BadRequestException('New end time must be greater');
    }

    const overlappingSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.doctorId = :doctorId', { doctorId })
      .andWhere('slot.slotDate = :slotDate', { slotDate })
      .andWhere('slot.startTime < :requestedEnd', {
        requestedEnd: newEndTime,
      })
      .andWhere('slot.endTime > :currentEnd', {
        currentEnd: slot.endTime,
      })
      .orderBy('slot.startTime', 'ASC')
      .getMany();

    let finalEnd = requestedEnd;
    const slotsToRemove: Slot[] = [];

    for (const s of overlappingSlots) {
      if (s.id === slot.id) continue;

      const sStart = this.timeToMinutes(s.startTime);
      const sEnd = this.timeToMinutes(s.endTime);

      // ✅ CORRECT overlap logic
      if (sStart < finalEnd && sEnd > currentEnd) {
        if (s.bookedCount > 0) {
          finalEnd = sStart;
          break;
        }

        slotsToRemove.push(s);
      }
    }

    if (finalEnd <= currentEnd) {
      throw new BadRequestException(
        'Cannot expand due to booked slot conflict',
      );
    }

    return this.slotRepo.manager.transaction(async (manager) => {
      if (slotsToRemove.length) {
        await manager.remove(slotsToRemove);
      }

      slot.endTime = this.minutesToTime(finalEnd);
      slot.isElastic = true;

      return manager.save(slot);
    });
  }

  // 🔥 EXPAND START
  private async expandSlotStartSmart(slot: Slot, newStartTime: string) {
    const doctorId = slot.doctor.id;
    const slotDate = slot.slotDate;

    const currentStart = this.timeToMinutes(slot.startTime);
    const requestedStart = this.timeToMinutes(newStartTime);

    if (requestedStart >= currentStart) {
      throw new BadRequestException(
        'New start time must be earlier than current',
      );
    }

    const overlappingSlots = await this.slotRepo
      .createQueryBuilder('slot')
      .where('slot.doctorId = :doctorId', { doctorId })
      .andWhere('slot.slotDate = :slotDate', { slotDate })
      .andWhere('slot.startTime < :currentStart', {
        currentStart: slot.startTime,
      })
      .andWhere('slot.endTime > :requestedStart', {
        requestedStart: newStartTime,
      })
      .orderBy('slot.startTime', 'DESC')
      .getMany();

    let finalStart = requestedStart;
    const slotsToRemove: Slot[] = [];

    for (const s of overlappingSlots) {
      if (s.id === slot.id) continue;

      const sStart = this.timeToMinutes(s.startTime);
      const sEnd = this.timeToMinutes(s.endTime);

      // ✅ CORRECT mirror logic
      if (sEnd > finalStart && sStart < currentStart) {
        if (s.bookedCount > 0) {
          finalStart = sEnd;
          break;
        }

        slotsToRemove.push(s);
      }
    }

    if (finalStart >= currentStart) {
      throw new BadRequestException(
        'Cannot expand due to booked slot conflict',
      );
    }

    return this.slotRepo.manager.transaction(async (manager) => {
      if (slotsToRemove.length) {
        await manager.remove(slotsToRemove);
      }

      slot.startTime = this.minutesToTime(finalStart);
      slot.isElastic = true;

      return manager.save(slot);
    });
  }

  // 🔥 SHRINK END (FINAL FIX)
  private async shrinkSlotEndSmart(slot: Slot, newEndTime: string) {
    const fresh = await this.slotRepo.findOne({ where: { id: slot.id } });

    if (!fresh) throw new NotFoundException('Slot not found');

    if (fresh.bookedCount > 0) {
      throw new BadRequestException(
        'Cannot shrink slot with existing bookings',
      );
    }

    const currentEnd = this.timeToMinutes(fresh.endTime);
    const requestedEnd = this.timeToMinutes(newEndTime);

    if (requestedEnd >= currentEnd) {
      throw new BadRequestException('New end must be smaller');
    }

    return this.slotRepo.manager.transaction(async (manager) => {
      fresh.endTime = newEndTime;
      fresh.isElastic = true;
      return manager.save(fresh);
    });
  }

  // 🔥 SHRINK START (FINAL FIX)
  private async shrinkSlotStartSmart(slot: Slot, newStartTime: string) {
    const fresh = await this.slotRepo.findOne({ where: { id: slot.id } });

    if (!fresh) throw new NotFoundException('Slot not found');

    if (fresh.bookedCount > 0) {
      throw new BadRequestException(
        'Cannot shrink slot with existing bookings',
      );
    }

    const currentStart = this.timeToMinutes(fresh.startTime);
    const requestedStart = this.timeToMinutes(newStartTime);

    if (requestedStart <= currentStart) {
      throw new BadRequestException('New start must be greater');
    }

    return this.slotRepo.manager.transaction(async (manager) => {
      fresh.startTime = newStartTime;
      fresh.isElastic = true;
      return manager.save(fresh);
    });
  }

  private async restructureSlots(slot: Slot, newDuration: number) {
    const availability = slot.availability;

    const start = this.timeToMinutes(availability.startTime);
    const end = this.timeToMinutes(availability.endTime);

    await this.slotRepo.delete({
      availability: { id: availability.id },
      slotDate: slot.slotDate,
    });

    let current = start;
    const newSlots: Slot[] = [];

    while (current + newDuration <= end) {
      newSlots.push(
        this.slotRepo.create({
          doctor: slot.doctor,
          availability,
          slotDate: slot.slotDate,
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(current + newDuration),
          maxPatients: slot.maxPatients,
          bookedCount: 0,
          originalDuration: newDuration,
          isElastic: false,
          reportingTime: slot.reportingTime,
        }),
      );
      current += newDuration;
    }

    await this.slotRepo.save(newSlots);

    return {
      message: 'Slots restructured successfully',
      totalSlots: newSlots.length,
    };
  }

  private isFutureSlot(slotDate: string, startTime: string): boolean {
    const now = new Date();
    return this.buildDateTime(slotDate, startTime) > now;
  }

  private buildDateTime(date: string, time: string): Date {
    const [y, m, d] = date.split('-').map(Number);
    const [h, min] = time.split(':').map(Number);
    return new Date(y, m - 1, d, h, min);
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private getReportingTime(startTime: string, reportingMinutes: number) {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m - reportingMinutes;
    return this.minutesToTime(total);
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
