import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EngagementHistory } from './engagement.entity';
import { Repository } from 'typeorm';

@Injectable()
export class EngagementService {
  constructor(
    @InjectRepository(EngagementHistory)
    private repo: Repository<EngagementHistory>,
  ) {}

  log(data: Partial<EngagementHistory>) {
    return this.repo.save(data);
  }
}
