import { PartialType } from '@nestjs/mapped-types';
import { SetAvailabilityDto } from './set-availability.dto';

export class UpdateAvailabilityDto extends PartialType(SetAvailabilityDto) {}
