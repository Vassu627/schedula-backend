import { Controller, Post, Patch, Get, Body, Param, Req } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { BookAppointmentDto } from './dto/book-appointment.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post('book')
  book(@Req() req, @Body() dto: BookAppointmentDto) {
    return this.appointmentsService.bookAppointment(req.user.id, dto);
  }

  @Patch(':id/reschedule')
  reschedule(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: RescheduleAppointmentDto,
  ) {
    return this.appointmentsService.rescheduleAppointment(req.user.id, id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Req() req, @Param('id') id: number) {
    return this.appointmentsService.cancelAppointment(req.user.id, id);
  }

  @Get('my')
  getMyAppointments(@Req() req) {
    return this.appointmentsService.getPatientAppointments(req.user.id);
  }
}
