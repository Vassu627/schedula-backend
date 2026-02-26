import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import { SlotsService } from './slots.service';
import { UpdateElasticSlotDto } from './dto/update-elasticslot.dto';

@Controller('slots')
export class SlotsController {
  constructor(private slotsService: SlotsService) {}

  @Get('doctor/:doctorId')
  getDoctorSlots(@Param('doctorId', ParseIntPipe) doctorId: number) {
    return this.slotsService.getDoctorSlots(doctorId);
  }
  @Patch(':slotId/elastic')
  updateElasticSlot(
    @Param('slotId', ParseIntPipe) slotId: number,
    @Body() dto: UpdateElasticSlotDto,
  ) {
    return this.slotsService.updateElasticSlot(slotId, dto);
  }
}
