import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service';
import { SupabaseService } from '../supabase/supabase.service';
import { User } from '@homehistory/database';
import { LoginDto, RegisterDto, AuthResponseDto, UserProfileDto } from './dto';
import { AuthLookupDto, LookupResponse } from './dto/lookup.dto';
import * as bcrypt from 'bcryptjs';
import { getConfig } from '../../config';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private supabase: SupabaseService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 12);

    // Create user in Supabase Auth
    const { data: { user: supabaseUser }, error } = await this.supabase
      .getAdminClient()
      .auth
      .admin
      .createUser({
        email: dto.email,
        password: dto.password,
        email_confirm: true,
        user_metadata: {
          name: dto.name,
          phone: dto.phone,
        },
      });

    if (error) {
      throw new BadRequestException(`Registration failed: ${error.message}`);
    }

    // Create user in our database
    const user = await this.prisma.user.create({
      data: {
        id: supabaseUser!.id,
        email: dto.email,
        name: dto.name || null,
        avatarUrl: null,
        role: 'USER',
      },
    });

    // Log registration
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_registered',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          email: user.email,
          registrationMethod: 'email',
        },
      },
    });

    return this.generateAuthResponse(user);
  }

  async lookup(dto: AuthLookupDto): Promise<LookupResponse> {
    const where: any = {};
    if (dto.email) where.email = dto.email.toLowerCase();
    if (dto.phone) where.phone = dto.phone;

    const user = await this.prisma.user.findFirst({
      where,
      include: { oauthAccounts: true, providerAccounts: true },
    });

    if (!user) {
      return { exists: false, providers: [] };
    }

    const providers = new Set<'password' | 'google' | 'facebook'>();
    providers.add('password');
    for (const acc of user.oauthAccounts) {
      if (acc.provider === 'google' || acc.provider === 'facebook') providers.add(acc.provider as any);
    }
    for (const acc of user.providerAccounts) {
      if (acc.provider === 'google' || acc.provider === 'facebook') providers.add(acc.provider as any);
    }
    return { exists: true, userId: user.id, providers: Array.from(providers) };
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    // Authenticate with Supabase
    const { data: { user: supabaseUser }, error } = await this.supabase
      .getClient()
      .auth
      .signInWithPassword({
        email: dto.email,
        password: dto.password,
      });

    if (error || !supabaseUser) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Get user from our database
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Log login
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        entityType: 'user',
        entityId: user.id,
        metadata: {
          loginMethod: 'email',
          timestamp: new Date(),
        },
      },
    });

    return this.generateAuthResponse(user);
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async validateSupabaseToken(token: string): Promise<User> {
    const { data: { user }, error } = await this.supabase
      .getClient()
      .auth
      .getUser(token);

    if (error || !user) {
      throw new UnauthorizedException('Invalid token');
    }

    // Find or create user in our database
    let dbUser = await this.prisma.user.findUnique({
      where: { email: user.email! },
    });

    if (!dbUser) {
      dbUser = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.name || null,
          avatarUrl: user.user_metadata?.avatar_url || null,
        },
      });
    }

    return dbUser;
  }

  async getUserProfile(userId: string): Promise<UserProfileDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      emailVerified: true, // Assuming Supabase handles verification
    };
  }

  async refreshToken(user: User, refreshToken: string): Promise<AuthResponseDto> {
    // In a production app, you'd validate the refresh token
    // For now, we'll generate a new token
    return this.generateAuthResponse(user);
  }

  async logout(userId: string): Promise<void> {
    // Log logout
    await this.prisma.auditLog.create({
      data: {
        userId,
        action: 'user_logout',
        entityType: 'user',
        entityId: userId,
        metadata: {
          timestamp: new Date(),
        },
      },
    });

    // In a production app, you'd invalidate the refresh token
    // For JWT tokens, logout is typically handled client-side
  }

  async forgotPassword(email: string): Promise<void> {
    // Send password reset email via Supabase
    const { error } = await this.supabase
      .getClient()
      .auth
      .resetPasswordForEmail(email, {
        redirectTo: `${getConfig().server.corsOrigin}/reset-password`,
      });

    if (error) {
      // Don't throw error to prevent email enumeration
      console.error('Password reset error:', error);
    }

    // Log password reset request
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'password_reset_requested',
          entityType: 'user',
          entityId: user.id,
          metadata: {
            email,
            timestamp: new Date(),
          },
        },
      });
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Verify and update password via Supabase
    const { data, error } = await this.supabase
      .getClient()
      .auth
      .updateUser({
        password: newPassword,
      });

    if (error) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Log password reset
    if (data.user) {
      const user = await this.prisma.user.findUnique({
        where: { email: data.user.email! },
      });

      if (user) {
        await this.prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'password_reset_completed',
            entityType: 'user',
            entityId: user.id,
            metadata: {
              timestamp: new Date(),
            },
          },
        });
      }
    }
  }

  async generateToken(user: User): Promise<AuthResponseDto> {
    return this.generateAuthResponse(user);
  }

  async handleOAuthLogin(oauthUser: any): Promise<AuthResponseDto> {
    const { email, firstName, lastName, picture, accessToken, refreshToken, provider, providerId } = oauthUser;

    // Check if user exists by email
    let user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        oauthAccounts: {
          where: { provider }
        }
      }
    });

    if (user) {
      // User exists, check if OAuth account is linked
      const existingOAuthAccount = user.oauthAccounts.find(acc => acc.provider === provider);
      
      if (!existingOAuthAccount) {
        // Link new OAuth provider to existing user
        await this.prisma.oAuthAccount.create({
          data: {
            provider,
            providerAccountId: providerId,
            userId: user.id,
            accessToken,
            refreshToken,
            expiresAt: refreshToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
            providerEmail: email,
            providerName: `${firstName} ${lastName}`,
            providerAvatar: picture,
          }
        });
      } else {
        // Update existing OAuth account
        await this.prisma.oAuthAccount.update({
          where: { id: existingOAuthAccount.id },
          data: {
            accessToken,
            refreshToken,
            expiresAt: refreshToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
            providerAvatar: picture,
          }
        });
      }
    } else {
      // Create new user with OAuth account
      user = await this.prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          avatarUrl: picture,
          role: 'USER',
          oauthAccounts: {
            create: {
              provider,
              providerAccountId: providerId,
              accessToken,
              refreshToken,
              expiresAt: refreshToken ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) : null,
              providerEmail: email,
              providerName: `${firstName} ${lastName}`,
              providerAvatar: picture,
            }
          }
        },
        include: {
          oauthAccounts: true
        }
      });
    }

    // Log OAuth login
    if (user) {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'oauth_login',
          entityType: 'user',
          entityId: user.id,
          metadata: {
            provider,
            email,
            loginMethod: 'oauth',
            timestamp: new Date(),
          },
        },
      });
    }

    if (!user) {
      throw new UnauthorizedException('User creation failed');
    }
    return this.generateAuthResponse(user);
  }

  async refreshTokens(user: User, refreshToken: string): Promise<AuthResponseDto> {
    // In a production app, you'd validate the refresh token against the database
    // For now, we'll generate new tokens
    return this.generateAuthResponse(user);
  }

  private generateAuthResponse(user: User | any): AuthResponseDto {
    const config = getConfig();
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: config.jwt.accessSecret,
      expiresIn: config.jwt.accessExpires,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: config.jwt.refreshSecret,
      expiresIn: config.jwt.refreshExpires,
    });

    const accessExpiresIn = parseInt(config.jwt.accessExpires.replace(/\D/g, '')) * 
      (config.jwt.accessExpires.includes('d') ? 86400 : 
       config.jwt.accessExpires.includes('h') ? 3600 : 60);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: 'Bearer',
      expires_in: accessExpiresIn,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        emailVerified: true,
      },
    };
  }
}
