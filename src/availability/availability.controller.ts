import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SetAvailabilityDto } from './dto/set-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Controller('availability')
export class AvailabilityController {
  constructor(private availabilityService: AvailabilityService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  setAvailability(@Req() req, @Body() dto: SetAvailabilityDto) {
    const userId = req.user.sub;
    return this.availabilityService.setAvailability(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMyAvailability(@Req() req) {
    const userId = req.user.sub;
    return this.availabilityService.getDoctorAvailability(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateAvailability(
    @Req() req,
    @Param('id') id: number,
    @Body() dto: UpdateAvailabilityDto,
  ) {
    const userId = req.user.sub;
    return this.availabilityService.updateAvailability(userId, id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteAvailability(@Req() req, @Param('id') id: number) {
    const userId = req.user.sub;
    return this.availabilityService.deleteAvailability(userId, id);
  }
}
