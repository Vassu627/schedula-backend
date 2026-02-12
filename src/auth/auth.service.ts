import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, Role } from '../users/user.entity';
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

  async selectRole(userId: number, role: Role) {
    // 1. Update user role
    const user = await this.usersService.updateRole(userId, role);

    // 2. Create role-based profile
    if (role === Role.DOCTOR) {
      const doctor = this.doctorRepo.create({
        user,
        isVerified: false,
      });
      await this.doctorRepo.save(doctor);
    }

    if (role === Role.PATIENT) {
      const patient = this.patientRepo.create({
        user,
      });
      await this.patientRepo.save(patient);
    }

    // 3. Return updated user
    return user;
  }
}
