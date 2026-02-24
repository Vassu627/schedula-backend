import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointments/appointment.entity';
import { Slot } from '../slots/slot.entity';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,

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
  async searchDoctors(query: any) {
    const { name, specialization } = query;

    const qb = this.doctorRepo
      .createQueryBuilder('doctor')
      .leftJoinAndSelect('doctor.user', 'user')
      .leftJoinAndSelect('doctor.profile', 'profile')
      .leftJoinAndSelect('profile.specializations', 'spec');

    if (name) {
      qb.andWhere('LOWER(user.name) LIKE LOWER(:name)', {
        name: `%${name}%`,
      });
    }

    if (specialization) {
      qb.andWhere('LOWER(spec.name) LIKE LOWER(:spec)', {
        spec: `%${specialization}%`,
      });
    }

    return qb.getMany();
  }
  async findByUserId(userId: number) {
    return this.doctorRepo.findOne({
      where: { user: { id: userId } },
    });
  }
  async getDoctorsWithNextAvailability() {
    const doctors = await this.doctorRepo.find({
      relations: ['user'],
    });

    const today = this.formatDate(new Date());

    const result: any[] = [];

    for (const doctor of doctors) {
      const nextSlot = await this.slotRepo.findOne({
        where: {
          doctor: { id: doctor.id },
          slotDate: MoreThanOrEqual(today),
        },
        order: {
          slotDate: 'ASC',
          startTime: 'ASC',
        },
      });

      if (nextSlot && nextSlot.bookedCount < nextSlot.maxPatients) {
        result.push({
          id: doctor.id,
          name: doctor.user?.name,
          specialization: doctor.specialization,
          nextAvailableSlot: `${nextSlot.slotDate} ${nextSlot.startTime}`,
          slotsEndpoint: `/slots/doctor/${doctor.id}`,
        });
      }
    }

    return result;
  }
  private formatDate(date: Date): string {
    const y = date.getFullYear();
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const d = date.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
}
