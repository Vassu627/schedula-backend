import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Get('doctor/:doctorId')
  getDoctorSlots(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.slotsService.getDoctorSlots(doctorId);
  }
}
