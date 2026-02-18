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
} from './availability.entity';
import { Doctor } from '../doctors/doctor.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';
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

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    if (
      dto.availabilityType === AvailabilityType.RECURRING &&
      dto.dayOfWeek === undefined
    ) {
      throw new BadRequestException(
        'dayOfWeek is required for recurring availability',
      );
    }

    if (dto.availabilityType === AvailabilityType.CUSTOM && !dto.date) {
      throw new BadRequestException('date is required for custom availability');
    }

    let slotDuration = dto.slotDuration;
    let maxPatients = dto.maxPatientsPerSlot;

    if (dto.schedulingType === SchedulingType.STREAM) {
      if (!dto.slotDuration) {
        throw new BadRequestException(
          'slotDuration is required for stream scheduling',
        );
      }
      maxPatients = 1; // force single patient
    }

    if (dto.schedulingType === SchedulingType.WAVE) {
      if (!dto.maxPatientsPerSlot || dto.maxPatientsPerSlot < 1) {
        throw new BadRequestException(
          'maxPatientsPerSlot is required for wave scheduling',
        );
      }
      slotDuration = undefined; // not used in wave
    }

    const availability = this.availabilityRepo.create({
      doctor,
      availabilityType: dto.availabilityType,
      dayOfWeek: dto.dayOfWeek,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration,
      maxPatientsPerSlot: maxPatients,
      schedulingType: dto.schedulingType,
    });

    const savedAvailability = await this.availabilityRepo.save(availability);

    const slots = this.generateSlots(doctor, savedAvailability);
    await this.slotRepo.save(slots);

    return savedAvailability;
  }

  async getDoctorAvailability(doctorUserId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.availabilityRepo.find({
      where: { doctor: { id: doctor.id } },
    });
  }

  async updateAvailability(
    doctorUserId: number,
    availabilityId: number,
    dto: any,
  ) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId, doctor: { id: doctor.id } },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async deleteAvailability(doctorUserId: number, availabilityId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const availability = await this.availabilityRepo.findOne({
      where: { id: availabilityId, doctor: { id: doctor.id } },
    });

    if (!availability) {
      throw new NotFoundException('Availability not found');
    }

    await this.availabilityRepo.remove(availability);

    return { message: 'Availability deleted' };
  }

  private generateSlots(doctor: Doctor, availability: Availability) {
    const slots: Slot[] = [];

    const slotDate =
      availability.availabilityType === AvailabilityType.CUSTOM
        ? availability.date
        : new Date().toISOString().split('T')[0];

    const start = this.timeToMinutes(availability.startTime);
    const end = this.timeToMinutes(availability.endTime);
    const totalDuration = end - start;
    if (availability.schedulingType === SchedulingType.STREAM) {
      const slot = this.slotRepo.create({
        doctor,
        availability,
        slotDate,
        startTime: availability.startTime,
        endTime: availability.endTime,
        maxPatients: 1,
        bookedCount: 0,
      });

      slots.push(slot);
    } else if (availability.schedulingType === SchedulingType.WAVE) {
      const capacity = availability.maxPatientsPerSlot;

      if (!capacity || capacity < 1) {
        throw new Error('Invalid capacity for wave scheduling');
      }

      const durationPerPatient = Math.floor(totalDuration / capacity);

      let current = start;

      for (let i = 0; i < capacity; i++) {
        const slotStart = this.minutesToTime(current);
        const slotEnd = this.minutesToTime(current + durationPerPatient);

        const slot = this.slotRepo.create({
          doctor,
          availability,
          slotDate,
          startTime: slotStart,
          endTime: slotEnd,
          maxPatients: 1,
          bookedCount: 0,
        });

        slots.push(slot);
        current += durationPerPatient;
      }
    }
    return slots;
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
