import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '@homehistory/database';
import { LoginDto, RegisterDto, AuthResponseDto, UserProfileDto } from './dto';
export declare class AuthService {
    private prisma;
    private supabase;
    private jwtService;
    constructor(prisma: PrismaService, supabase: SupabaseService, jwtService: JwtService);
    register(dto: RegisterDto): Promise<AuthResponseDto>;
    login(dto: LoginDto): Promise<AuthResponseDto>;
    validateUser(userId: string): Promise<User | null>;
    validateSupabaseToken(token: string): Promise<User>;
    getUserProfile(userId: string): Promise<UserProfileDto>;
    refreshToken(user: User, refreshToken: string): Promise<AuthResponseDto>;
    logout(userId: string): Promise<void>;
    forgotPassword(email: string): Promise<void>;
    resetPassword(token: string, newPassword: string): Promise<void>;
    generateToken(user: User): Promise<AuthResponseDto>;
    private generateAuthResponse;
}
//# sourceMappingURL=auth.service.d.ts.map
