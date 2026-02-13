import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Doctor } from '../doctors/doctor.entity';
import { Specialization } from 'src/specializations/specialization.entity';

@Entity('doctor_profiles')
export class DoctorProfile {
  @PrimaryGeneratedColumn()
  id: number;

  @OneToOne(() => Doctor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'doctor_id' })
  doctor: Doctor;

  @Column({ nullable: true })
  experience: number;

  @Column({ nullable: true })
  licenseNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  fee: number;

  @ManyToMany(() => Specialization)
  @JoinTable({
    name: 'doctor_profile_specializations',
    joinColumn: { name: 'profile_id', referencedColumnName: 'id' },
    inverseJoinColumn: {
      name: 'specialization_id',
      referencedColumnName: 'id',
    },
  })
  specializations: Specialization[];

  @Column({ default: false })
  isVerified: boolean;
}
