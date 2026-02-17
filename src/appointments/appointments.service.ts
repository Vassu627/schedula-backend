import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Slot } from '../slots/slot.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from '../doctors/doctor.entity';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async bookAppointment(patientUserId: number, slotId: number) {
    // 1. Find patient
    const patient = await this.patientRepo.findOne({
      where: { user: { id: patientUserId } },
      relations: ['user'],
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    // 2. Find slot
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['doctor'],
    });

    if (!slot) {
      throw new NotFoundException('Slot not found');
    }

    // 3. Check capacity
    if (slot.bookedCount >= slot.maxPatients) {
      throw new BadRequestException('Slot is fully booked');
    }

    // 4. Create appointment
    const appointment = this.appointmentRepo.create({
      doctor: slot.doctor,
      patient,
      slot,
      status: AppointmentStatus.CONFIRMED,
    });

    // 5. Increment slot count
    slot.bookedCount += 1;

    await this.slotRepo.save(slot);
    return this.appointmentRepo.save(appointment);
  }

  async cancelAppointment(userId: number, appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'patient.user', 'slot'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // ensure the patient owns this appointment
    if (appointment.patient.user.id !== userId) {
      throw new ForbiddenException('Not your appointment');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      return appointment;
    }

    // reduce slot count
    const slot = appointment.slot;
    slot.bookedCount = Math.max(0, slot.bookedCount - 1);
    await this.slotRepo.save(slot);

    // cancel appointment
    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }
  async rescheduleAppointment(
    userId: number,
    userRole: string,
    appointmentId: number,
    newSlotId: number,
  ) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: [
        'patient',
        'patient.user',
        'doctor',
        'doctor.user',
        'slot',
        'slot.doctor',
      ],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    // Authorization check
    if (userRole === 'patient') {
      if (appointment.patient.user.id !== userId) {
        throw new ForbiddenException('Not your appointment');
      }
    }

    if (userRole === 'doctor') {
      if (appointment.doctor.user.id !== userId) {
        throw new ForbiddenException('Not your appointment');
      }
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('Cannot reschedule cancelled appointment');
    }

    // find new slot
    const newSlot = await this.slotRepo.findOne({
      where: { id: newSlotId },
      relations: ['doctor'],
    });

    if (!newSlot) {
      throw new NotFoundException('New slot not found');
    }

    // check capacity
    if (newSlot.bookedCount >= newSlot.maxPatients) {
      throw new BadRequestException('New slot is full');
    }

    const oldSlot = appointment.slot;

    // decrease old slot count
    oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
    await this.slotRepo.save(oldSlot);

    // increase new slot count
    newSlot.bookedCount += 1;
    await this.slotRepo.save(newSlot);

    // update appointment
    appointment.slot = newSlot;
    appointment.doctor = newSlot.doctor;

    return this.appointmentRepo.save(appointment);
  }

  async getPatientAppointments(userId: number) {
    const patient = await this.patientRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!patient) {
      throw new NotFoundException('Patient not found');
    }

    return this.appointmentRepo.find({
      where: { patient: { id: patient.id } },
      relations: ['doctor', 'slot'],
      order: { createdAt: 'DESC' },
    });
  }

  async getDoctorAppointments(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return this.appointmentRepo.find({
      where: { doctor: { id: doctor.id } },
      relations: ['patient', 'slot'],
      order: { createdAt: 'DESC' },
    });
  }
}
