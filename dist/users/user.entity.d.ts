import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';
export declare enum Role {
    DOCTOR = "doctor",
    PATIENT = "patient",
    ADMIN = "admin"
}
export declare class User {
    id: number;
    googleId: string;
    email: string;
    name: string;
    picture: string;
    role: Role;
    doctor?: Doctor;
    patient?: Patient;
}
