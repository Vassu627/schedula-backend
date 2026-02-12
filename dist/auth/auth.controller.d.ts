import express from 'express';
import { AuthService } from './auth.service';
import { Role } from '../users/user.entity';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    getProfile(req: express.Request): {
        message: string;
        user: Express.User | undefined;
    };
    googleAuth(): Promise<void>;
    googleAuthRedirect(req: any): Promise<{
        access_token: string;
        user: import("../users/user.entity").User;
    }>;
    selectRole(req: any, body: {
        role: Role;
    }): Promise<import("../users/user.entity").User>;
}
