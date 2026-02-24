import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Appointment } from './appointment.entity';
import { Slot } from '../slots/slot.entity';
import { Doctor } from '../doctors/doctor.entity';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { PatientsModule } from '../patients/patients.module';
import { NotificationModule } from 'src/notifications/notification.module';
import { DoctorsModule } from 'src/doctors/doctors.module';
@Module({
  imports: [
    TypeOrmModule.forFeature([Appointment, Slot, Doctor]),
    PatientsModule,
    NotificationModule,
    DoctorsModule,
  ],
  providers: [AppointmentsService],
  controllers: [AppointmentsController],
})
export class AppointmentsModule {}
