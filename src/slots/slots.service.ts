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

    console.log('TOTAL SLOTS:', slots.length);

    const grouped: Record<string, any[]> = {};

    for (const slot of slots) {
      console.log('CHECKING SLOT:', slot.id);

      console.log('booked vs max:', slot.bookedCount, slot.maxPatients);

      const isFuture = this.isFutureSlot(slot.slotDate, slot.startTime);

      console.log('isFuture:', isFuture);

      // 🔥 FILTER LOGIC
      if (slot.bookedCount >= slot.maxPatients || !isFuture) {
        console.log('❌ FILTERED OUT');
        continue;
      }

      console.log('✅ INCLUDED');

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

  // ---------------- ELASTIC UPDATE ----------------
  async updateElasticSlot(slotId: number, dto: UpdateElasticSlotDto) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['availability'],
    });

    if (!slot) throw new NotFoundException('Slot not found');

    // ❌ prevent past updates
    const now = new Date();
    const slotDateTime = this.buildDateTime(slot.slotDate, slot.startTime);

    if (slotDateTime <= now) {
      throw new BadRequestException('Cannot modify past/ongoing slot');
    }

    // ❌ empty request
    if (!dto.newCapacity && !dto.newDuration) {
      throw new BadRequestException('No changes provided');
    }

    // ❌ validation
    if (dto.newCapacity !== undefined && dto.newCapacity <= 0) {
      throw new BadRequestException('Invalid capacity');
    }

    if (dto.newDuration !== undefined && dto.newDuration <= 0) {
      throw new BadRequestException('Invalid duration');
    }

    // ✅ Capacity update
    if (dto.newCapacity !== undefined) {
      if (slot.bookedCount > dto.newCapacity) {
        throw new BadRequestException(
          'Cannot reduce capacity below booked count',
        );
      }

      slot.maxPatients = dto.newCapacity;
    }

    if (dto.newDuration !== undefined) {
      if (!slot.originalDuration) {
        throw new BadRequestException(
          'Duration update not allowed for STREAM slots',
        );
      }

      slot.currentDuration = dto.newDuration;
      slot.isElastic = true;
    }

    return this.slotRepo.save(slot);
  }

  // ---------------- HELPERS ----------------

  private isFutureSlot(slotDate: string, startTime: string): boolean {
    const now = new Date();
    const slotDateTime = this.buildDateTime(slotDate, startTime);

    return slotDateTime > now;
  }

  private buildDateTime(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
  }

  private getReportingTime(
    startTime: string,
    reportingMinutes: number,
  ): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 + m - reportingMinutes;

    const rh = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const rm = (total % 60).toString().padStart(2, '0');

    return `${rh}:${rm}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
