import { Controller, Post, Get, Body, Req, UseGuards } from '@nestjs/common';
import { DoctorProfilesService } from './doctor-profiles.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CreateDoctorProfileDto } from './dto/create-doctor-profile.dto';

@Controller('doctor-profiles')
export class DoctorProfilesController {
  constructor(private profilesService: DoctorProfilesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createProfile(@Req() req, @Body() dto: CreateDoctorProfileDto) {
    const userId = req.user.sub;
    return this.profilesService.createProfile(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyProfile(@Req() req) {
    const userId = req.user.sub;
    return this.profilesService.getMyProfile(userId);
  }
}
