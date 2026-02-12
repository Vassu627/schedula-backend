import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { User } from '../users/user.entity';
interface GoogleUser {
    googleId: string;
    email: string | null;
    name: string;
}
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    handleGoogleLogin(googleUser: GoogleUser): Promise<{
        access_token: string;
        user: User;
    }>;
}
export {};
