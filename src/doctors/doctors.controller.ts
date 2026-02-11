import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  Req,
  UseGuards,
} from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AppointmentStatus } from '../appointments/appointment.entity';

@Controller('api/v1/doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('appointments')
  getAppointments(@Req() req) {
    return this.doctorsService.getAppointments(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('appointments/:id')
  updateStatus(@Param('id') id: number, @Body('status') status: string) {
    return this.doctorsService.updateAppointmentStatus(
      Number(id),
      status as AppointmentStatus,
    );
  }
}
