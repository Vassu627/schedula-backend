import { Repository } from 'typeorm';
import { User, Role } from './user.entity';
export declare class UsersService {
    private usersRepo;
    constructor(usersRepo: Repository<User>);
    findByGoogleId(googleId: string): Promise<User | null>;
    findByEmail(email: string): Promise<User | null>;
    create(data: {
        email: string;
        name: string;
        googleId: string;
        role?: string;
    }): Promise<User>;
    updateRole(userId: number, role: Role): Promise<User>;
}
