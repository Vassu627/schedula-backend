import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,
  ) {}

  async getUnverifiedDoctors() {
    return this.doctorRepo.find({
      where: { isVerified: false },
      relations: ['user'],
    });
  }

  async verifyDoctor(doctorId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { id: doctorId },
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    doctor.isVerified = true;
    return this.doctorRepo.save(doctor);
  }
}
