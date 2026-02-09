import { Repository } from 'typeorm';
import { User } from './user.entity';
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    findByGoogleId(googleId: string): Promise<User | null>;
    createUser(data: Partial<User>): Promise<User>;
}
