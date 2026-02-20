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

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

@Entity()
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Doctor, { onDelete: 'CASCADE' })
  doctor: Doctor;

  @Column({ type: 'enum', enum: AvailabilityType })
  availabilityType: AvailabilityType;

  // For recurring
  @Column({ nullable: true })
  startDate: string;

  @Column({ nullable: true })
  endDate: string;

  @Column({
    type: 'enum',
    enum: DayOfWeek,
    array: true,
    nullable: true,
  })
  daysOfWeek: DayOfWeek[];

  // For custom
  @Column({ nullable: true })
  date: string;

  @Column()
  startTime: string;

  @Column()
  endTime: string;

  @Column({ type: 'enum', enum: SchedulingType })
  schedulingType: SchedulingType;

  @Column({ nullable: true })
  slotDuration: number;

  @Column()
  capacity: number;
}
