import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Slot } from './slot.entity';

@Injectable()
export class SlotsService {
  constructor(
    @InjectRepository(Slot)
    private slotRepo: Repository<Slot>,
  ) {}

  async getDoctorSlots(doctorId: number) {
    const today = this.formatDate(new Date());

    const slots = await this.slotRepo.find({
      where: {
        doctor: { id: doctorId },
        slotDate: MoreThanOrEqual(today),
      },
      order: {
        slotDate: 'ASC',
        startTime: 'ASC',
      },
    });

    const grouped: Record<string, any[]> = {};

    for (const slot of slots) {
      if (
        slot.bookedCount >= slot.maxPatients ||
        !this.isFutureSlot(slot.slotDate, slot.startTime)
      ) {
        continue;
      }

      if (!grouped[slot.slotDate]) {
        grouped[slot.slotDate] = [];
      }

      grouped[slot.slotDate].push({
        id: slot.id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        availableSpots: slot.maxPatients - slot.bookedCount,
        reportingTime: this.getReportingTime(
          slot.startTime,
          slot.reportingTime,
        ),
      });
    }

    return grouped;
  }

  private isFutureSlot(slotDate: string, startTime: string): boolean {
    const now = new Date();
    const slotDateTime = new Date(`${slotDate}T${startTime}`);
    return slotDateTime > now;
  }

  private getReportingTime(
    startTime: string,
    reportingMinutes: number,
  ): string {
    const [h, m] = startTime.split(':').map(Number);
    const total = h * 60 - reportingMinutes + m;

    const rh = Math.floor(total / 60)
      .toString()
      .padStart(2, '0');
    const rm = (total % 60).toString().padStart(2, '0');

    return `${rh}:${rm}`;
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
