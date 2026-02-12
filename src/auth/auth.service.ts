import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';

interface GoogleUser {
  googleId: string;
  email: string | null;
  name: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async handleGoogleLogin(googleUser: GoogleUser): Promise<{
    access_token: string;
    user: User;
  }> {
    const { googleId, email, name } = googleUser;

    if (!email) {
      throw new Error('Google account has no email');
    }

    let user = await this.usersService.findByGoogleId(googleId);

    if (!user) {
      user = await this.usersService.create({
        googleId,
        email,
        name,
      });
    }

    const payload = { sub: user.id, role: user.role };
    const token = this.jwtService.sign(payload);

    return {
      access_token: token,
      user,
    };
  }
}
