import { IsInt, Min, Max, IsString } from 'class-validator';

export class SetAvailabilityDto {
  @IsInt()
  @Min(0)
  @Max(6)
  dayOfWeek: number;

  @IsString()
  startTime: string;

  @IsString()
  endTime: string;

  @IsInt()
  @Min(5)
  slotDuration: number;

  @IsInt()
  @Min(1)
  maxPatientsPerSlot: number;
}
