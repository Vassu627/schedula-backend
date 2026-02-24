import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile, VerifyCallback } from 'passport-google-oauth20';

interface GoogleUser {
  googleId: string;
  email: string | null;
  name: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    console.log('CALLBACK URL:', process.env.GOOGLE_CALLBACK_URL);
    super({
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
      scope: ['email', 'profile'],
    });
  }

  validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ): void {
    try {
      const email =
        Array.isArray(profile.emails) && profile.emails.length > 0
          ? profile.emails[0].value
          : null;

      const user: GoogleUser = {
        googleId: profile.id,
        email,
        name: profile.displayName,
      };

      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }
}
