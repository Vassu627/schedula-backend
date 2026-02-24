import { Controller, Get, Param, Patch } from '@nestjs/common';
import { NotificationService } from './notification.service';

@Controller('notifications')
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get('patient/:id')
  getPatientNotifications(@Param('id') id: number) {
    return this.service.getByPatient(id);
  }

  @Get(':patientId')
  getNotifications(@Param('patientId') patientId: number) {
    return this.service.getByPatient(patientId);
  }
  @Get('doctor/:id')
  getDoctorNotifications(@Param('id') id: number) {
    return this.service.getByDoctor(id);
  }

  @Patch(':id/read')
  markRead(@Param('id') id: number) {
    return this.service.markAsRead(id);
  }
}
