import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('google')
  async googleLogin(@Body() body: { idToken: string; role?: string }) {
    return this.authService.googleLogin(body.idToken, body.role || 'patient');
  }
}
