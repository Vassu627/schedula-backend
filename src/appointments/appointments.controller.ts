import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Delete,
  Param,
  Patch,
  Get,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private appointmentsService: AppointmentsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('book')
  book(@Req() req, @Body() dto: BookAppointmentDto) {
    const userId = req.user.sub;
    return this.appointmentsService.bookAppointment(userId, dto.slotId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  cancel(@Req() req, @Param('id') id: number) {
    const userId = req.user.sub;
    return this.appointmentsService.cancelAppointment(userId, id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id/reschedule')
  reschedule(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    const userId = req.user.sub;
    const role = req.user.role;
    return this.appointmentsService.rescheduleAppointment(
      userId,
      role,
      id,
      dto.newSlotId,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyAppointments(@Req() req) {
    const userId = req.user.sub;
    return this.appointmentsService.getPatientAppointments(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('doctor/me')
  getDoctorAppointments(@Req() req) {
    const userId = req.user.sub;
    return this.appointmentsService.getDoctorAppointments(userId);
  }
}
