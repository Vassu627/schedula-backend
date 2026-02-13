import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('doctors')
export class DoctorsController {
  constructor(private doctorsService: DoctorsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(
    @Req() req,
    @Body()
    body: {
      experience?: number;
      licenseNo?: string;
      fee?: number;
    },
  ) {
    const userId = req.user.sub;
    return this.doctorsService.updateProfile(userId, body);
  }
}
