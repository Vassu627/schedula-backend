import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialization } from './specialization.entity';

@Injectable()
export class SpecializationsService {
  constructor(
    @InjectRepository(Specialization)
    private specRepo: Repository<Specialization>,
  ) {}

  async findAll() {
    return this.specRepo.find();
  }

  async create(name: string) {
    const spec = this.specRepo.create({ name });
    return this.specRepo.save(spec);
  }
}
