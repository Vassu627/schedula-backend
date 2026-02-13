import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { DoctorProfile } from './doctor-profile.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Specialization } from 'src/specializations/specialization.entity';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';

@Injectable()
export class DoctorProfilesService {
  constructor(
    @InjectRepository(DoctorProfile)
    private profileRepo: Repository<DoctorProfile>,

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Specialization)
    private specializationRepo: Repository<Specialization>,
  ) {}

  async createProfile(userId: number, dto: CreateDoctorProfileDto) {
    // 1. Find doctor using userId
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    // 2. Fetch specializations
    const specializations = await this.specializationRepo.findBy({
      id: In(dto.specializationIds),
    });

    // 3. Create profile
    const profile = this.profileRepo.create({
      doctor,
      experience: dto.experience,
      fee: dto.fee,
      licenseNo: dto.licenseNo,
      specializations,
      isVerified: false,
    });

    return this.profileRepo.save(profile);
  }

  async getMyProfile(userId: number) {
    const doctor = await this.doctorRepo.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });

    if (!doctor) {
      throw new Error('Doctor not found');
    }

    return this.profileRepo.findOne({
      where: { doctor: { id: doctor.id } },
      relations: ['specializations', 'doctor'],
    });
  }
}
