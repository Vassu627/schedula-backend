import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Availability,
  AvailabilityType,
  SchedulingType,
  DayOfWeek,
} from './availability.entity';
import { Doctor } from '../doctors/doctor.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Slot } from '../slots/slot.entity';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
  ) {}

  async setAvailability(doctorUserId: number, dto: SetAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
      relations: ['user'],
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    this.validateAvailability(dto);

    // Conflict detection
    await this.checkAvailabilityConflict(doctor.id, dto);

    const availability = this.availabilityRepo.create({
      doctor,
      ...dto,
    });

    const saved = await this.availabilityRepo.save(availability);

    await this.generateSlots(doctor, saved);

    return saved;
  }

  async updateAvailability(
    userId: number,
    id: number,
    dto: UpdateAvailabilityDto,
  ) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    const availability = await this.availabilityRepo.findOne({
      where: { id, doctor: { id: doctor.id } },
    });

    if (!availability) throw new NotFoundException('Availability not found');

    Object.assign(availability, dto);

    this.validateAvailability(availability as SetAvailabilityDto);

    // Conflict check (exclude current record)
    await this.checkAvailabilityConflict(doctor.id, availability, id);

    const updated = await this.availabilityRepo.save(availability);

    // delete old slots
    await this.slotRepo.delete({ availability: { id } });

    // regenerate slots
    await this.generateSlots(doctor, updated);

    return updated;
  }
  async deleteAvailability(userId: number, id: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    const availability = await this.availabilityRepo.findOne({
      where: { id, doctor: { id: doctor.id } },
    });

    if (!availability) throw new NotFoundException('Availability not found');

    await this.slotRepo.delete({ availability: { id } });
    await this.availabilityRepo.remove(availability);

    return { message: 'Availability deleted successfully' };
  }

  async getDoctorAvailability(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    return this.availabilityRepo.find({
      where: { doctor: { id: doctor.id } },
    });
  }

  private async checkAvailabilityConflict(
    doctorId: number,
    dto: SetAvailabilityDto,
    excludeId?: number,
  ) {
    const existing = await this.availabilityRepo.find({
      where: { doctor: { id: doctorId } },
    });

    for (const avail of existing) {
      if (excludeId && avail.id === excludeId) continue;

      // CUSTOM vs CUSTOM conflict
      if (
        dto.availabilityType === AvailabilityType.CUSTOM &&
        avail.availabilityType === AvailabilityType.CUSTOM &&
        dto.date &&
        avail.date &&
        dto.date === avail.date
      ) {
        const timeOverlap =
          dto.startTime < avail.endTime && dto.endTime > avail.startTime;

        if (timeOverlap) {
          throw new BadRequestException(
            'Conflicting custom availability exists for this date',
          );
        }
      }

      // RECURRING vs RECURRING conflict
      if (
        dto.availabilityType === AvailabilityType.RECURRING &&
        avail.availabilityType === AvailabilityType.RECURRING
      ) {
        if (dto.startDate && dto.endDate && avail.startDate && avail.endDate) {
          const dateOverlap =
            dto.startDate <= avail.endDate && dto.endDate >= avail.startDate;

          const dayOverlap = dto.daysOfWeek?.some((d) =>
            avail.daysOfWeek?.includes(d),
          );

          const timeOverlap =
            dto.startTime < avail.endTime && dto.endTime > avail.startTime;

          if (dateOverlap && dayOverlap && timeOverlap) {
            throw new BadRequestException(
              'Conflicting recurring availability exists',
            );
          }
        }
      }
    }
  }

  private async generateSlots(doctor: Doctor, availability: Availability) {
    if (availability.availabilityType === AvailabilityType.RECURRING) {
      await this.generateRecurringSlots(doctor, availability);
    } else {
      await this.overrideWithCustom(doctor, availability);
    }
  }

  private async generateRecurringSlots(
    doctor: Doctor,
    availability: Availability,
  ) {
    const startDate = new Date(availability.startDate);
    const endDate = new Date(availability.endDate);

    for (
      let date = new Date(startDate);
      date <= endDate;
      date.setDate(date.getDate() + 1)
    ) {
      const dayName = this.getDayName(date);

      if (!availability.daysOfWeek?.includes(dayName)) continue;

      const formattedDate = this.formatDate(date);

      await this.createSlotsForDate(doctor, availability, formattedDate);
    }
  }

  private async overrideWithCustom(doctor: Doctor, availability: Availability) {
    await this.slotRepo.delete({
      doctor: { id: doctor.id },
      slotDate: availability.date,
    });

    await this.createSlotsForDate(doctor, availability, availability.date);
  }

  private async createSlotsForDate(
    doctor: Doctor,
    availability: Availability,
    date: string,
  ) {
    const start = this.timeToMinutes(availability.startTime);
    const end = this.timeToMinutes(availability.endTime);

    if (availability.schedulingType === SchedulingType.STREAM) {
      await this.slotRepo.save({
        doctor,
        availability,
        slotDate: date,
        startTime: availability.startTime,
        endTime: availability.endTime,
        maxPatients: availability.capacity,
        bookedCount: 0,
      });
    }

    if (availability.schedulingType === SchedulingType.WAVE) {
      let current = start;

      while (current + availability.slotDuration <= end) {
        await this.slotRepo.save({
          doctor,
          availability,
          slotDate: date,
          startTime: this.minutesToTime(current),
          endTime: this.minutesToTime(current + availability.slotDuration),
          maxPatients: availability.capacity,
          bookedCount: 0,
        });

        current += availability.slotDuration;
      }
    }
  }

  private validateAvailability(dto: SetAvailabilityDto) {
    if (dto.availabilityType === AvailabilityType.RECURRING) {
      if (!dto.startDate || !dto.endDate || !dto.daysOfWeek?.length) {
        throw new BadRequestException(
          'Recurring requires startDate, endDate and daysOfWeek',
        );
      }
    }

    if (dto.availabilityType === AvailabilityType.CUSTOM && !dto.date) {
      throw new BadRequestException('Custom requires date');
    }

    if (dto.schedulingType === SchedulingType.WAVE) {
      if (!dto.slotDuration || !dto.capacity) {
        throw new BadRequestException(
          'slotDuration and capacity required for WAVE scheduling',
        );
      }
    }

    if (!dto.capacity || dto.capacity <= 0) {
      throw new BadRequestException('Capacity must be greater than 0');
    }
  }

  private getDayName(date: Date): DayOfWeek {
    const map = {
      0: DayOfWeek.SUNDAY,
      1: DayOfWeek.MONDAY,
      2: DayOfWeek.TUESDAY,
      3: DayOfWeek.WEDNESDAY,
      4: DayOfWeek.THURSDAY,
      5: DayOfWeek.FRIDAY,
      6: DayOfWeek.SATURDAY,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return map[date.getDay()];
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private timeToMinutes(time: string): number {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }

  private minutesToTime(minutes: number): string {
    const h = Math.floor(minutes / 60)
      .toString()
      .padStart(2, '0');
    const m = (minutes % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  }
}
