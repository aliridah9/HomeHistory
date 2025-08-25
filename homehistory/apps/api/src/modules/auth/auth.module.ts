import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { SupabaseStrategy } from './strategies/supabase.strategy';
import { getConfig } from '../../config';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: getConfig().jwt.accessSecret,
      signOptions: { expiresIn: getConfig().jwt.accessExpires },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy, 
    RefreshStrategy,
    GoogleStrategy,
    FacebookStrategy,
    SupabaseStrategy
  ],
  exports: [AuthService],
})
export class AuthModule {}
