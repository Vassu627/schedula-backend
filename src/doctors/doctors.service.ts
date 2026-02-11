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

  async updateAppointmentStatus(
    appointmentId: number,
    status: AppointmentStatus,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
    });

    if (!appointment) {
      throw new Error('Appointment not found');
    }

    appointment.status = status;
    return this.appointmentRepo.save(appointment);
  }
}
