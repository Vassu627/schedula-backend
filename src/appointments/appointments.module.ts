import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { Slot } from '../slots/slot.entity';
import { Patient } from '../patients/patient.entity';
import { Doctor } from 'src/doctors/doctor.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Slot, Patient, Doctor])],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
