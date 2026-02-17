import { Controller, Get, Param } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Get('doctor/:doctorId')
  getDoctorSlots(@Param('doctorId') doctorId: number) {
    return this.slotsService.getDoctorSlots(doctorId);
  }
}
