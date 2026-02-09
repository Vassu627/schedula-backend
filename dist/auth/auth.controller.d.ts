import { AuthService } from './auth.service';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    googleLogin(body: {
        idToken: string;
        role?: string;
    }): Promise<{
        access_token: string;
        user: import("../users/user.entity").User;
    }>;
}
