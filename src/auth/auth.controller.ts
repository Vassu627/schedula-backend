import { Controller, Get, Req, UseGuards, Post, Body } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import express from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { Role } from '../users/user.entity';

interface GoogleUser {
  googleId: string;
  email: string | null;
  name: string;
}

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: express.Request) {
    return {
      message: 'Protected route accessed',
      user: req.user,
    };
  }

  // Step 1: Google login
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: any) {
    return this.authService.handleGoogleLogin(req.user);
  }

  // Step 2: Role selection
  @UseGuards(JwtAuthGuard)
  @Post('select-role')
  async selectRole(@Req() req, @Body() body: { role: Role }) {
    console.log('REQ USER:', req.user);
    const userId = req.user.sub;
    return this.authService.selectRole(userId, body.role);
  }
}
