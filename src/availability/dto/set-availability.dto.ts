import { AvailabilityType, SchedulingType } from '../availability.entity';

export enum DayOfWeek {
  MONDAY = 'MONDAY',
  TUESDAY = 'TUESDAY',
  WEDNESDAY = 'WEDNESDAY',
  THURSDAY = 'THURSDAY',
  FRIDAY = 'FRIDAY',
  SATURDAY = 'SATURDAY',
  SUNDAY = 'SUNDAY',
}

export class SetAvailabilityDto {
  availabilityType: AvailabilityType;

  startDate?: string;
  endDate?: string;

  daysOfWeek?: DayOfWeek[];

  date?: string;

  startTime: string;
  endTime: string;

  schedulingType: SchedulingType;

  slotDuration?: number;

  capacity: number;
}
