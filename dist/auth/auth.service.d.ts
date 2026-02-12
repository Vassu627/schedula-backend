import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User, Role } from '../users/user.entity';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
import { Repository } from 'typeorm';
interface GoogleUser {
    googleId: string;
    email: string | null;
    name: string;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    private doctorRepo;
    private patientRepo;
    constructor(usersService: UsersService, jwtService: JwtService, doctorRepo: Repository<Doctor>, patientRepo: Repository<Patient>);
    handleGoogleLogin(googleUser: GoogleUser): Promise<{
        access_token: string;
        user: User;
    }>;
    selectRole(userId: number, role: Role): Promise<User>;
}
export {};
