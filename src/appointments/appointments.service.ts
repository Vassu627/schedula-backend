import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
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

    private dataSource: DataSource,
  ) {}

  async bookAppointment(userId: number, dto: BookAppointmentDto) {
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new NotFoundException('Patient not found');

    return this.dataSource.transaction(async (manager) => {
      const slot = await manager.findOne(Slot, {
        where: { id: dto.slotId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) throw new NotFoundException('Slot not found');

      if (slot.bookedCount >= slot.maxPatients) {
        throw new BadRequestException('Slot is full');
      }

      const existing = await manager.findOne(Appointment, {
        where: {
          patient: { id: patient.id },
          slot: { id: slot.id },
          status: AppointmentStatus.CONFIRMED,
        },
      });

      if (existing) {
        throw new BadRequestException('You already booked this slot');
      }

      slot.bookedCount += 1;
      await manager.save(slot);

      const appointment = manager.create(Appointment, {
        patient,
        doctor: slot.doctor,
        slot,
        status: AppointmentStatus.CONFIRMED,
      });

      return manager.save(appointment);
    });
  }

  async cancelAppointment(userId: number, appointmentId: number) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        relations: ['patient', 'patient.user', 'slot'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) throw new NotFoundException('Appointment not found');

      if (appointment.patient.user.id !== userId)
        throw new ForbiddenException('Not your appointment');

      if (appointment.status === AppointmentStatus.CANCELLED) {
        return appointment;
      }

      const slot = await manager.findOne(Slot, {
        where: { id: appointment.slot.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) {
        throw new NotFoundException('Slot not found');
      }

      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      await manager.save(slot);

      appointment.status = AppointmentStatus.CANCELLED;
      return manager.save(appointment);
    });
  }

  async rescheduleAppointment(
    userId: number,
    appointmentId: number,
    dto: RescheduleAppointmentDto,
  ) {
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new NotFoundException('Patient not found');

    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        relations: ['slot', 'patient'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) throw new NotFoundException('Appointment not found');

      if (appointment.patient.id !== patient.id) {
        throw new BadRequestException('Not your appointment');
      }

      const newSlot = await manager.findOne(Slot, {
        where: { id: dto.newSlotId },
        relations: ['doctor'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!newSlot) throw new NotFoundException('New slot not found');

      if (newSlot.bookedCount >= newSlot.maxPatients) {
        throw new BadRequestException('New slot is full');
      }

      const oldSlot = await manager.findOne(Slot, {
        where: { id: appointment.slot.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!oldSlot) {
        throw new NotFoundException('Old slot not found');
      }

      oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
      newSlot.bookedCount += 1;

      await manager.save(oldSlot);
      await manager.save(newSlot);

      appointment.slot = newSlot;
      appointment.doctor = newSlot.doctor;

      return manager.save(appointment);
    });
  }

  async getPatientAppointments(userId: number) {
    const patient = await this.patientsService.findByUserId(userId);
    if (!patient) throw new NotFoundException('Patient not found');

    return this.appointmentRepo.find({
      where: { patient: { id: patient.id } },
      relations: ['slot'],
      order: { createdAt: 'DESC' },
    });
  }

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
