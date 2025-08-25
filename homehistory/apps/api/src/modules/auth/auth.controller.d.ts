import { AuthService } from './auth.service';
import { LoginDto, RegisterDto, SupabaseLoginDto, RefreshTokenDto, AuthResponseDto, UserProfileDto } from './dto';
import { User } from '@homehistory/database';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    supabaseLogin(dto: SupabaseLoginDto): Promise<AuthResponseDto>;
    getProfile(user: User): Promise<UserProfileDto>;
    refreshToken(user: User, dto: RefreshTokenDto): Promise<AuthResponseDto>;
    logout(user: User): Promise<{
        message: string;
    }>;
    forgotPassword(dto: {
        email: string;
    }): Promise<{
        message: string;
    }>;
    resetPassword(dto: {
        token: string;
        password: string;
    }): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=auth.controller.d.ts.map
