import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from './doctor.entity';
import {
  Appointment,
  AppointmentStatus,
} from '../appointments/appointment.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async getAppointments(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: [
        'appointments',
        'appointments.patient',
        'appointments.patient.user',
      ],
    });

    return doctor?.appointments || [];
  }

  async updateProfile(
    userId: number,
    data: {
      experience?: number;
      licenseNo?: string;
      fee?: number;
    },
  ) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    doctor.experience = data.experience ?? doctor.experience;
    doctor.licenseNo = data.licenseNo ?? doctor.licenseNo;
    doctor.fee = data.fee ?? doctor.fee;

    return this.doctorRepo.save(doctor);
  }
}
