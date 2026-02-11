import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('api/v1/patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('appointments')
  book(@Req() req, @Body() body) {
    return this.patientsService.bookAppointment(
      req.user.id,
      body.doctorId,
      new Date(body.time),
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('appointments')
  getAppointments(@Req() req) {
    return this.patientsService.getAppointments(req.user.id);
  }
}
