import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @Column()
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column()
  slotDuration: number; // minutes

  @Column()
  maxPatientsPerSlot: number;
}
