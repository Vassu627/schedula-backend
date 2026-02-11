import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, Role } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepo: Repository<User>,
  ) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { googleId } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email } });
  }

  async create(data: {
    email: string;
    name: string;
    googleId: string;
    role?: string;
  }): Promise<User> {
    const user = this.usersRepo.create({
      email: data.email,
      name: data.name,
      googleId: data.googleId,
      role: (data.role as Role) || Role.PATIENT,
    });

    return await this.usersRepo.save(user);
  }
}
