import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Availability } from '../availability/availability.entity';

@Entity('slots')
export class Slot {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @ManyToOne(() => Availability, { onDelete: 'CASCADE' })
  availability: Availability;

  @Column({ type: 'date' })
  slotDate: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column()
  maxPatients: number;

  @Column({ default: 0 })
  bookedCount: number;
}
