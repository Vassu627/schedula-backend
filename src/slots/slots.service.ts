import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slot } from './slot.entity';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
  ) {}

  async getDoctorSlots(doctorId: number) {
    const today = new Date().toISOString().split('T')[0];

    return this.slotRepo.find({
      where: {
        doctor: { id: doctorId },
        slotDate: today,
      },
      relations: ['doctor'],
      order: {
        slotDate: 'ASC',
        startTime: 'ASC',
      },
    });
  }
}
