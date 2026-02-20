import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Patient } from './patient.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Appointment } from '../appointments/appointment.entity';
//import { Slot } from 'src/slots/slot.entity';

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

  async findByUserId(userId: number) {
    return this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
  }

  async updateProfile(
    userId: number,
    data: {
      age?: number;
      gender?: string;
    },
  ) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!patient) {
      throw new Error('Patient not found');
    }

    patient.age = data.age ?? patient.age;
    patient.gender = data.gender ?? patient.gender;

    return this.patientRepo.save(patient);
  }

  async getAppointments(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
      relations: ['appointments', 'appointments.doctor'],
    });

    return patient?.appointments || [];
  }
}
