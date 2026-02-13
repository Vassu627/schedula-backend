import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Role } from '../users/user.entity';
import { AdminService } from './admin.service';

@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // 1. View unverified doctors
  @Get('doctors/pending')
  async getPendingDoctors() {
    return this.adminService.getUnverifiedDoctors();
  }

  // 2. Verify doctor
  @Patch('doctors/:id/verify')
  async verifyDoctor(@Param('id') doctorId: number) {
    return this.adminService.verifyDoctor(doctorId);
  }
}
