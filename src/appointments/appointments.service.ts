import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between } from 'typeorm';
import { Appointment, AppointmentStatus } from './appointment.entity';
import { Slot } from '../slots/slot.entity';
import { PatientsService } from '../patients/patients.service';
import { Doctor } from '../doctors/doctor.entity';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { NotificationService } from 'src/notifications/notification.service';
import { DoctorsService } from 'src/doctors/doctors.service';

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
    private readonly doctorsService: DoctorsService,
    private dataSource: DataSource,
    private readonly notificationService: NotificationService,
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
      const slotWithDoctor = await manager.findOne(Slot, {
        where: { id: dto.slotId },
        relations: ['doctor'],
      });

      if (!slotWithDoctor?.doctor) {
        throw new BadRequestException('Doctor not assigned to this slot');
      }

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
        doctor: slotWithDoctor.doctor,
        slot,
        status: AppointmentStatus.CONFIRMED,
      });

      const savedAppointment = await manager.save(appointment);

      await this.notificationService.create(
        {
          patient,
          doctor: slotWithDoctor.doctor,
          appointment: savedAppointment,
          type: 'CONFIRM',
          message: `Appointment booked at ${slot.startTime}`,
        },
        manager,
      );

      return savedAppointment;
    });
  }
  async cancelAppointment(userId: number, appointmentId: number) {
    return this.dataSource.transaction(async (manager) => {
      const appointment = await manager.findOne(Appointment, {
        where: { id: appointmentId },
        relations: ['patient', 'patient.user', 'slot', 'doctor'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!appointment) throw new NotFoundException('Appointment not found');

      if (appointment.patient.user.id !== userId) {
        throw new ForbiddenException('Not your appointment');
      }

      if (appointment.status === AppointmentStatus.CANCELLED) {
        return appointment;
      }

      const slot = await manager.findOne(Slot, {
        where: { id: appointment.slot.id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!slot) throw new NotFoundException('Slot not found');

      slot.bookedCount = Math.max(0, slot.bookedCount - 1);
      await manager.save(slot);

      appointment.status = AppointmentStatus.CANCELLED;

      await this.notificationService.create(
        {
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointment,
          type: 'CANCELLED',
          message: `Appointment cancelled at ${appointment.slot.startTime}`,
        },
        manager,
      );

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

      if (!oldSlot) throw new NotFoundException('Old slot not found');

      oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
      newSlot.bookedCount += 1;

      await manager.save(oldSlot);
      await manager.save(newSlot);

      appointment.slot = newSlot;
      appointment.doctor = newSlot.doctor;

      await this.notificationService.create(
        {
          patient: appointment.patient,
          doctor: appointment.doctor,
          appointment,
          type: 'RESCHEDULED',
          message: `Appointment moved to ${newSlot.startTime}`,
        },
        manager,
      );

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
  async updateStatus(id: number, status: AppointmentStatus) {
    const appointment = await this.appointmentRepo.findOne({
      where: { id },
      relations: ['patient', 'doctor'],
    });

    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }

    appointment.status = status;
    await this.appointmentRepo.save(appointment);

    if (status === AppointmentStatus.COMPLETED) {
      await this.notificationService.create({
        patient: appointment.patient,
        doctor: appointment.doctor,
        appointment,
        type: 'FOLLOW_UP',
        message: 'Book a follow-up if needed.',
      });
    }
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
  async getTodayAnalytics() {
    const today = new Date().toISOString().split('T')[0];

    const appointments = await this.appointmentRepo.find({
      where: { slot: { slotDate: today } },
      relations: ['slot'],
    });

    return {
      totalAppointments: appointments.length,
      confirmed: appointments.filter(
        (a) => a.status === AppointmentStatus.CONFIRMED,
      ).length,
      cancelled: appointments.filter(
        (a) => a.status === AppointmentStatus.CANCELLED,
      ).length,
      completed: appointments.filter(
        (a) => a.status === AppointmentStatus.COMPLETED,
      ).length,
    };
  }
  async getDoctorAnalytics(userId: number) {
    const doctor = await this.doctorsService.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    const slots = await this.slotRepo.find({
      where: { doctor: { id: doctor.id } },
    });

    const totalSlots = slots.length;

    const appointments = await this.appointmentRepo.find({
      where: { doctor: { id: doctor.id } },
    });

    const booked = appointments.filter(
      (a) => a.status === AppointmentStatus.CONFIRMED,
    ).length;

    const cancelled = appointments.filter(
      (a) => a.status === AppointmentStatus.CANCELLED,
    ).length;

    const utilization = totalSlots === 0 ? 0 : (booked / totalSlots) * 100;

    return {
      totalSlots,
      booked,
      cancelled,
      utilization: `${utilization.toFixed(2)}%`,
    };
  }
  async getDoctorAnalyticsByRange(userId: number, range: 'today' | 'week') {
    const doctor = await this.doctorsService.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    const now = new Date();

    let start: Date;
    let end: Date;

    if (range === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date(now.setHours(23, 59, 59, 999));
    } else {
      start = new Date();
      start.setHours(0, 0, 0, 0);

      end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
    }

    const startStr = start.toISOString().split('T')[0];
    const endStr = end.toISOString().split('T')[0];

    const appointments = await this.appointmentRepo.find({
      where: {
        doctor: { id: doctor.id },
        slot: { slotDate: Between(startStr, endStr) },
      },
      relations: ['slot'],
    });

    return {
      total: appointments.length,
      confirmed: appointments.filter(
        (a) => a.status === AppointmentStatus.CONFIRMED,
      ).length,
      cancelled: appointments.filter(
        (a) => a.status === AppointmentStatus.CANCELLED,
      ).length,
    };
  }

  async getPeakHours(userId: number) {
    const doctor = await this.doctorsService.findByUserId(userId);
    if (!doctor) throw new NotFoundException('Doctor not found');

    const appointments = await this.appointmentRepo.find({
      where: {
        doctor: { id: doctor.id },
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['slot'],
    });

    const map = new Map<string, number>();

    for (const appt of appointments) {
      const time = appt.slot.startTime;
      map.set(time, (map.get(time) || 0) + 1);
    }

    return Array.from(map.entries())
      .map(([time, count]) => ({ time, count }))
      .sort((a, b) => b.count - a.count);
  }
}
