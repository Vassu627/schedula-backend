import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DoctorProfilesService } from './doctor-profiles.service';
import { DoctorProfilesController } from './doctor-profiles.controller';
import { DoctorProfile } from './doctor-profile.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Specialization } from 'src/specializations/specialization.entity';

@Module({
  imports: [TypeOrmModule.forFeature([DoctorProfile, Doctor, Specialization])],
  providers: [DoctorProfilesService],
  controllers: [DoctorProfilesController],
})
export class DoctorProfilesModule {}
