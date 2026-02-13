import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Availability } from './availability.entity';
import { Doctor } from '../doctors/doctor.entity';
import { SetAvailabilityDto } from './dto/set-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepo: Repository<Availability>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async setAvailability(doctorUserId: number, dto: SetAvailabilityDto) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: doctorUserId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    const availability = this.availabilityRepo.create({
      doctor: doctor,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
      slotDuration: dto.slotDuration,
      maxPatientsPerSlot: dto.maxPatientsPerSlot,
    });

    return this.availabilityRepo.save(availability);
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
}
