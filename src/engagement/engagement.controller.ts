import { Body, Controller, Post } from '@nestjs/common';
import { EngagementService } from './engagement.service';

@Controller('engagement')
export class EngagementController {
  constructor(private service: EngagementService) {}

  @Post()
  log(@Body() body) {
    return this.service.log(body);
  }
}
