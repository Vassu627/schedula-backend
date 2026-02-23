import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Appointment,
  AppointmentStatus,
} from 'src/appointments/appointment.entity';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class NotificationScheduler {
  constructor(
    @InjectRepository(Appointment)
    private appointmentRepo: Repository<Appointment>,
    private notificationService: NotificationService,
  ) {}

  @Cron('*/10 * * * *') // every 10 minutes
  async sendReminders() {
    console.log('Running reminder cron...');

    const now = new Date();

    const appointments = await this.appointmentRepo.find({
      where: {
        status: AppointmentStatus.CONFIRMED,
      },
      relations: ['patient', 'patient.user', 'slot', 'doctor'],
    });

    console.log('Appointments found:', appointments.length);

    for (const appt of appointments) {
      console.log('Processing appointment:', appt.id);

      const slotDateTime = new Date(
        `${appt.slot.slotDate}T${appt.slot.startTime}`,
      );

      const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

      if (slotDateTime < now || slotDateTime > oneHourLater) {
        console.log('Skipping (not within reminder window)');
        continue;
      }

      const message = `Reminder: Appointment at ${appt.slot.startTime}`;

      const existing = await this.notificationService.findExisting(
        appt.patient.id,
        'REMINDER',
        appt.id,
      );

      if (existing) {
        console.log('Skipping duplicate...');
        continue;
      }

      console.log('Creating notification...');

      await this.notificationService.create({
        patient: appt.patient,
        doctor: appt.doctor,
        type: 'REMINDER',
        message,
        appointment: appt,
      });
    }
  }
}
