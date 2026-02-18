import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';

export enum AvailabilityType {
  RECURRING = 'RECURRING',
  CUSTOM = 'CUSTOM',
}

export enum SchedulingType {
  STREAM = 'STREAM',
  WAVE = 'WAVE',
}

@Entity('availabilities')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @Column({
    type: 'enum',
    enum: AvailabilityType,
    default: AvailabilityType.RECURRING,
  })
  availabilityType: AvailabilityType;

  @Column({ nullable: true })
  dayOfWeek: number; // 0–6

  @Column({ type: 'date', nullable: true })
  date: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ nullable: true })
  slotDuration: number;

  @Column()
  maxPatientsPerSlot: number;

  @Column({
    type: 'enum',
    enum: SchedulingType,
    default: SchedulingType.STREAM,
  })
  schedulingType: SchedulingType;
}
