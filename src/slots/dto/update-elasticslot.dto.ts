export class UpdateElasticSlotDto {
  newDuration?: number;
  newCapacity?: number;
  restructure?: boolean;

  // 🔥 EXPANSION
  expandEndTime?: string;
  expandStartTime?: string;

  // 🔥 SHRINK
  shrinkEndTime?: string;
  shrinkStartTime?: string;
}
