import { Patient } from 'src/patients/patient.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Doctor } from 'src/doctors/doctor.entity';
import { Appointment } from 'src/appointments/appointment.entity';
@Entity()
export class Notification {
  @PrimaryGeneratedColumn()
  notification_id: number;

  @ManyToOne(() => Doctor, { nullable: true })
  doctor: Doctor;

  @ManyToOne(() => Patient)
  patient: Patient;

  @ManyToOne(() => Appointment, { nullable: true })
  appointment: Appointment;

  @Column()
  type: string;

  @Column()
  message: string;

  @Column({ default: false })
  is_read: boolean;

  @CreateDateColumn()
  created_at: Date;
}
