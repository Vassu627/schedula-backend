import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Appointment } from '../appointments/appointment.entity';

@Injectable()
export class PatientsService {
  constructor(
    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
  ) {}

  async bookAppointment(userId: number, doctorId: number, time: Date) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const appointment = new Appointment();
    appointment.doctor = doctor;
    appointment.patient = patient;
    appointment.time = time;

    return this.appointmentRepo.save(appointment);
  }

  async getAppointments(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['appointments', 'appointments.doctor'],
    });

    return patient?.appointments || [];
  }
}
