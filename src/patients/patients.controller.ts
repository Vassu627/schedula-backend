import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common';
import { PatientsService } from './patients.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('patients')
export class PatientsController {
  constructor(private patientsService: PatientsService) {}

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  async updateProfile(
    @Req() req,
    @Body()
    body: { age?: number; gender?: string },
  ) {
    const userId = req.user.sub;
    return this.patientsService.updateProfile(userId, body);
  }
}
