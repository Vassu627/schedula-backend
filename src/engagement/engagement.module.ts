import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EngagementHistory } from './engagement.entity';
import { EngagementService } from './engagement.service';
import { EngagementController } from './engagement.controller';

@Module({
  imports: [TypeOrmModule.forFeature([EngagementHistory])],
  controllers: [EngagementController],
  providers: [EngagementService],
})
export class EngagementModule {}
