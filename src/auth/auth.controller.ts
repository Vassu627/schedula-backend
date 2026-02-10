import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';
import express from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

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
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(): Promise<void> {}

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Req() req: express.Request & { user: GoogleUser }) {
    return this.authService.handleGoogleLogin(req.user);
  }
}
