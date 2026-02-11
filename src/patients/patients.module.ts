import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Patient } from './patient.entity';
import { PatientsService } from './patients.service';
import { Doctor } from '../doctors/doctor.entity';
import { Appointment } from '../appointments/appointment.entity';
import { PatientsController } from './patients.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Patient, Doctor, Appointment])],
  controllers: [PatientsController],
  providers: [PatientsService],
  exports: [PatientsService],
})
export class PatientsModule {}
