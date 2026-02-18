import { IsEnum, IsOptional, IsNumber, IsString } from 'class-validator';
import { AvailabilityType, SchedulingType } from '../availability.entity';

export class SetAvailabilityDto {
  @IsEnum(AvailabilityType)
  availabilityType: AvailabilityType;

  @IsOptional()
  @IsNumber()
  dayOfWeek?: number;

  @IsOptional()
  @IsString()
  date?: string;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsOptional()
  @IsNumber()
  slotDuration?: number;

  @IsOptional()
  @IsNumber()
  maxPatientsPerSlot?: number;

  @IsEnum(SchedulingType)
  schedulingType: SchedulingType;
}
