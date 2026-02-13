import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('specializations')
export class Specialization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;
}
