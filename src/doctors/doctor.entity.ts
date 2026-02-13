import {
  Entity,
  PrimaryGeneratedColumn,
  OneToOne,
  JoinColumn,
  Column,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Appointment } from '../appointments/appointment.entity';
import { DoctorProfile } from '../doctor-profiles/doctor-profile.entity';

@Entity()
export class Doctor {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => User, (user) => user.doctor)
  @JoinColumn()
  user: User;

  @Column({ nullable: true })
  experience: number;

  @Column({ nullable: true })
  licenseNo: string;

  @Column({ nullable: true })
  fee: number;

  @Column({ default: false })
  isVerified: boolean;

  @OneToMany(() => Appointment, (appointment) => appointment.doctor)
  appointments: Appointment[];

  @OneToOne(() => DoctorProfile, (profile) => profile.doctor)
  profile: DoctorProfile;
}
