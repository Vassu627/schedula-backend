import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async verifyGoogleToken(idToken: string): Promise<TokenPayload> {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    if (!payload) {
      throw new UnauthorizedException('Invalid Google payload');
    }

    return payload;
  }

  async googleLogin(idToken: string, role: string) {
    const payload = await this.verifyGoogleToken(idToken);

    let user = await this.usersService.findByGoogleId(payload.sub);

    if (!user) {
      user = await this.usersService.createUser({
        googleId: payload.sub,
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
        role: role || 'patient',
      });
    }

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      access_token: token,
      user,
    };
  }
}
