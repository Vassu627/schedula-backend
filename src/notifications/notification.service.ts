import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, EntityManager } from 'typeorm';
import { Notification } from './notification.entity';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private repo: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>, manager?: EntityManager) {
    const repo = manager ? manager.getRepository(Notification) : this.repo;

    const notification = await repo.save(data);

    await this.sendEmail(notification);
    this.sendSMS(notification);

    return notification;
  }

  async getByPatient(patientId: number) {
    return this.repo.find({
      where: { patient: { id: patientId } },
      relations: ['patient', 'patient.user'],
      order: { created_at: 'DESC' },
    });
  }

  async getByDoctor(doctorId: number) {
    const data = await this.repo.find({
      where: { doctor: { id: doctorId } },
      relations: ['doctor', 'patient', 'patient.user'],
      order: { created_at: 'DESC' },
    });

    console.log('Doctor notifications:', data);
    return data;
  }

  async markAsRead(id: number) {
    return this.repo.update(id, { is_read: true });
  }

  async findExisting(patientId: number, type: string, appointmentId: number) {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);

    return this.repo.findOne({
      where: {
        patient: { id: patientId },
        type,
        appointment: { id: appointmentId },
        created_at: MoreThan(last24Hours),
      },
    });
  }

  private async sendEmail(notification: Notification) {
    console.log('Inside sendEmail()...');

    const transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: '8193684dfc316b',
        pass: 'dae70881f5ec53',
      },
    });

    const email = notification.patient?.user?.email;

    console.log('Sending email to:', email);

    if (!email) {
      console.log('No email found for patient');
      return;
    }

    const mailOptions = {
      from: 'yourpersonal@gmail.com',
      to: email,
      subject: `Schedula Notification - ${notification.type}`,
      text: `
Hello ${notification.patient?.user?.name || 'Patient'},

${notification.message}

Thank you,
Schedula Team
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('Email sent!');
    } catch (error) {
      console.error('Email error:', error);
    }
  }

  private sendSMS(notification: Notification) {
    console.log(`SMS sent to patient ${notification.patient?.id}`);
    console.log(`Message: ${notification.message}`);
  }
}
