import { Controller, Get, Post, Body } from '@nestjs/common';
import { SpecializationsService } from './specializations.service';

@Controller('specializations')
export class SpecializationsController {
  constructor(private specService: SpecializationsService) {}

  @Get()
  getAll() {
    return this.specService.findAll();
  }

  @Post()
  create(@Body() body: { name: string }) {
    return this.specService.create(body.name);
  }
}
