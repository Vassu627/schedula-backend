import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Req,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('book')
  book(@Req() req, @Body() dto: BookAppointmentDto) {
    return this.appointmentsService.bookAppointment(req.user.sub, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  reschedule(
    @Req() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(
      req.user.sub,
      id,
      dto,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.appointmentsService.cancelAppointment(req.user.sub, id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my')
  getMyAppointments(@Req() req) {
    return this.appointmentsService.getPatientAppointments(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('analytics/today')
  getTodayAnalytics() {
    return this.appointmentsService.getTodayAnalytics();
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/analytics')
  getAnalytics(@Req() req) {
    return this.appointmentsService.getDoctorAnalytics(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/analytics/:range')
  getAnalyticsByRange(@Req() req, @Param('range') range: 'today' | 'week') {
    return this.appointmentsService.getDoctorAnalyticsByRange(
      req.user.sub,
      range,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/analytics/peak-hours')
  getPeakHours(@Req() req) {
    return this.appointmentsService.getPeakHours(req.user.sub);
  }
}
