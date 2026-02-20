import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Doctor } from './doctor.entity';
import { Appointment } from '../appointments/appointment.entity';
import { DoctorsService } from './doctors.service';
import { DoctorsController } from './doctors.controller';
import { Slot } from 'src/slots/slot.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Doctor, Appointment, Slot])],
  controllers: [DoctorsController],
  providers: [DoctorsService],
})
export class DoctorsModule {}
