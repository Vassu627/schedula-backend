import { IsInt } from 'class-validator';

export class BookAppointmentDto {
  @IsInt()
  slotId: number;
}
