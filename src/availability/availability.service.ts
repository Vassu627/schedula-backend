import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
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

  // -------------------------------
  // CREATE AVAILABILITY + SLOTS
  // -------------------------------
  async setAvailability(doctorUserId: number, dto: SetAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const availability = this.availabilityRepo.create({
      doctor,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration: dto.slotDuration,
      maxPatientsPerSlot: dto.maxPatientsPerSlot,
    });

    const savedAvailability = await this.availabilityRepo.save(availability);

    // generate slots
    const slots = this.generateSlots(doctor, savedAvailability);
    await this.slotRepo.save(slots);

    return savedAvailability;
  }

  // -------------------------------
  // GET AVAILABILITY
  // -------------------------------
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

  // -------------------------------
  // UPDATE AVAILABILITY
  // -------------------------------
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

  // -------------------------------
  // DELETE AVAILABILITY
  // -------------------------------
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

  // -------------------------------
  // SLOT GENERATION LOGIC
  // -------------------------------
  private generateSlots(doctor: Doctor, availability: Availability) {
    const slots: Slot[] = [];

    const start = this.timeToMinutes(availability.startTime);
    const end = this.timeToMinutes(availability.endTime);
    const duration = availability.slotDuration;

    let current = start;

    while (current + duration <= end) {
      const slotStart = this.minutesToTime(current);
      const slotEnd = this.minutesToTime(current + duration);

      const slot = this.slotRepo.create({
        doctor,
        availability,
        slotDate: new Date().toISOString().split('T')[0], // today
        startTime: slotStart,
        endTime: slotEnd,
        maxPatients: availability.maxPatientsPerSlot,
        bookedCount: 0,
      });

      slots.push(slot);
      current += duration;
    }

    return slots;
  }

  // -------------------------------
  // TIME HELPERS
  // -------------------------------
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
