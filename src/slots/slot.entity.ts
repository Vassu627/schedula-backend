import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Availability } from '../availability/availability.entity';

@Index(['doctor', 'slotDate'])
@Entity()
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @ManyToOne(() => Availability, { onDelete: 'CASCADE' })
  availability: Availability;

  @Column({ type: 'date' })
  slotDate: string;

  @Column({ type: 'time' })
  startTime: string;

  @Column({ type: 'time' })
  endTime: string;

  @Column()
  maxPatients: number;

  @Column({ default: 0 })
  bookedCount: number;
  @Column({ nullable: true })
  currentDuration: number;

  @Column({ default: false })
  isElastic: boolean;

  @Column({ nullable: true })
  originalDuration: number;

  @Column({ default: 10 })
  reportingTime: number;
}
