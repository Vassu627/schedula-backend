import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class EngagementHistory {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  patient_id: number;

  @Column()
  action: string;

  @Column({ nullable: true })
  metadata: string;

  @CreateDateColumn()
  created_at: Date;
}
