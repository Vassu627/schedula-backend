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
import { PatientsService } from '../patients/patients.service';
import { Doctor } from '../doctors/doctor.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,

    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    private patientsService: PatientsService,
  ) {}

  // BOOK
  async bookAppointment(userId: number, dto: BookAppointmentDto) {
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new NotFoundException('Patient not found');

    const slot = await this.slotRepo.findOne({
      where: { id: dto.slotId },
    });

    if (!slot) throw new NotFoundException('Slot not found');

    if (slot.bookedCount >= slot.maxPatients)
      throw new BadRequestException('Slot is full');

    const existing = await this.appointmentRepo.findOne({
      where: {
        patient: { id: patient.id },
        slot: { id: slot.id },
        status: AppointmentStatus.CONFIRMED,
      },
    });

    if (existing) throw new BadRequestException('You already booked this slot');

    slot.bookedCount += 1;
    await this.slotRepo.save(slot);

    const appointment = this.appointmentRepo.create({
      patient,
      slot,
      status: AppointmentStatus.CONFIRMED,
    });

    return this.appointmentRepo.save(appointment);
  }

  // CANCEL
  async cancelAppointment(userId: number, appointmentId: number) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['patient', 'patient.user', 'slot'],
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.patient.user.id !== userId)
      throw new ForbiddenException('Not your appointment');

    if (appointment.status === AppointmentStatus.CANCELLED) return appointment;

    const slot = appointment.slot;
    slot.bookedCount = Math.max(0, slot.bookedCount - 1);
    await this.slotRepo.save(slot);

    appointment.status = AppointmentStatus.CANCELLED;
    return this.appointmentRepo.save(appointment);
  }

  // RESCHEDULE
  async rescheduleAppointment(
    userId: number,
    appointmentId: number,
    dto: RescheduleAppointmentDto,
  ) {
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new NotFoundException('Patient not found');

    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId },
      relations: ['slot', 'patient'],
    });

    if (!appointment) throw new NotFoundException('Appointment not found');

    if (appointment.patient.id !== patient.id)
      throw new BadRequestException('Not your appointment');

    const newSlot = await this.slotRepo.findOne({
      where: { id: dto.newSlotId },
    });

    if (!newSlot) throw new NotFoundException('New slot not found');

    if (newSlot.bookedCount >= newSlot.maxPatients)
      throw new BadRequestException('New slot is full');

    const oldSlot = appointment.slot;
    oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
    await this.slotRepo.save(oldSlot);

    newSlot.bookedCount += 1;
    await this.slotRepo.save(newSlot);

    appointment.slot = newSlot;

    return this.appointmentRepo.save(appointment);
  }

  // PATIENT VIEW
  async getPatientAppointments(userId: number) {
    const patient = await this.patientsService.findByUserId(userId);

    if (!patient) throw new NotFoundException('Patient not found');

    return this.appointmentRepo.find({
      where: { patient: { id: patient.id } },
      relations: ['slot'],
      order: { createdAt: 'DESC' },
    });
  }

  // DOCTOR VIEW
  async getDoctorAppointments(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });

    if (!doctor) throw new NotFoundException('Doctor not found');

    return this.appointmentRepo.find({
      where: { slot: { doctor: { id: doctor.id } } },
      relations: ['patient', 'slot'],
      order: { createdAt: 'DESC' },
    });
  }
}
