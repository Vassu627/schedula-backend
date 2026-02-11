import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Patient } from '../patients/patient.entity';

export enum Role {
  DOCTOR = 'doctor',
  PATIENT = 'patient',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  googleId: string;

  @Column()
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  picture: string;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.PATIENT,
  })
  role: Role;

  @OneToOne(() => Doctor, (doctor) => doctor.user)
  doctor?: Doctor;

  @OneToOne(() => Patient, (patient) => patient.user)
  patient?: Patient;
}
