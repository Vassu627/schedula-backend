import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { TokenPayload } from 'google-auth-library';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    verifyGoogleToken(idToken: string): Promise<TokenPayload>;
    googleLogin(idToken: string, role: string): Promise<{
        access_token: string;
        user: import("../users/user.entity").User;
    }>;
}
