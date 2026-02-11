import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

    @InjectRepository(Doctor)
    private doctorRepo: Repository<Doctor>,

    @InjectRepository(Patient)
    private patientRepo: Repository<Patient>,
  ) {}

  // Step 1: Google login
  async handleGoogleLogin(googleUser: GoogleUser) {
    if (!googleUser.email) {
      throw new Error('Google account has no email');
    }

    const user = await this.usersService.findByEmail(googleUser.email);

    // If user exists → login
    if (user) {
      const payload = {
        sub: user.id,
        email: user.email,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    }

    // If user does not exist → ask for role
    return {
      needsRoleSelection: true,
      googleUser: {
        googleId: googleUser.googleId,
        email: googleUser.email,
        name: googleUser.name,
      },
    };
  }

  // Step 2: Role selection
  async selectRole(data: {
    googleId: string;
    email: string;
    name: string;
    role: string;
  }) {
    // Create user with role
    const user = await this.usersService.create({
      googleId: data.googleId,
      email: data.email,
      name: data.name,
      role: data.role,
    });

    // Create role-based profile
    if (data.role === 'doctor') {
      const doctor = new Doctor();
      doctor.user = user;
      doctor.isVerified = false;
      await this.doctorRepo.save(doctor);
    } else {
      const patient = new Patient();
      patient.user = user;
      await this.patientRepo.save(patient);
    }

    // Generate token
    const payload = {
      sub: user.id,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }
}
