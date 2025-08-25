import { Controller, Post, Get, Body, UseGuards, HttpCode, HttpStatus, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RefreshGuard } from './guards/refresh.guard';
import { OAuthGuard } from './guards/oauth.guard';
import { FacebookOAuthGuard } from './guards/facebook-oauth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { 
  LoginDto, 
  RegisterDto, 
  SupabaseLoginDto, 
  RefreshTokenDto,
  AuthResponseDto,
  UserProfileDto,
  OAuthCallbackResponseDto,
  OAuthErrorResponseDto
} from './dto';
import { User } from '@homehistory/database';
import { getConfig } from '../../config';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('lookup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lookup whether a user exists by email or phone' })
  async lookup(@Body() dto: import('./dto/lookup.dto').AuthLookupDto): Promise<import('./dto/lookup.dto').LookupResponse> {
    return this.authService.lookup(dto);
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid registration data' })
  async register(@Body() dto: RegisterDto, @Res() res: Response): Promise<void> {
    const auth = await this.authService.register(dto);
    const config = getConfig();
    res.cookie('access_token', auth.access_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: auth.expires_in * 1000,
    });
    res.cookie('refresh_token', auth.refresh_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(auth);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() dto: LoginDto, @Res() res: Response): Promise<void> {
    const auth = await this.authService.login(dto);
    const config = getConfig();
    res.cookie('access_token', auth.access_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: auth.expires_in * 1000,
    });
    res.cookie('refresh_token', auth.refresh_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json(auth);
  }

  @Post('supabase')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with Supabase token' })
  @ApiResponse({ status: 200, description: 'Supabase login successful', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid Supabase token' })
  async supabaseLogin(@Body() dto: SupabaseLoginDto): Promise<AuthResponseDto> {
    const user = await this.authService.validateSupabaseToken(dto.token);
    return this.authService.generateToken(user);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'User profile retrieved', type: UserProfileDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser() user: User): Promise<UserProfileDto> {
    return this.authService.getUserProfile(user.id);
  }

  @Post('refresh-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokenWithBody(
    @CurrentUser() user: User,
    @Body() dto: RefreshTokenDto
  ): Promise<AuthResponseDto> {
    return this.authService.refreshToken(user, dto.refreshToken);
  }



  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Request password reset' })
  @ApiResponse({ status: 200, description: 'Password reset email sent' })
  async forgotPassword(@Body() dto: { email: string }): Promise<{ message: string }> {
    await this.authService.forgotPassword(dto.email);
    return { message: 'Password reset email sent if account exists' };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset password with token' })
  @ApiResponse({ status: 200, description: 'Password reset successful' })
  async resetPassword(@Body() dto: { token: string; password: string }): Promise<{ message: string }> {
    await this.authService.resetPassword(dto.token, dto.password);
    return { message: 'Password reset successful' };
  }

  // OAuth Google endpoints
  @Get('google')
  @UseGuards(OAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Google OAuth' })
  async googleAuth() {
    // Guard will handle the OAuth flow
  }

  @Get('google/callback')
  @UseGuards(OAuthGuard)
  @ApiOperation({ summary: 'Google OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth login successful', type: OAuthCallbackResponseDto })
  @ApiResponse({ status: 401, description: 'OAuth login failed', type: OAuthErrorResponseDto })
  async googleAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const oauthUser = req.user as any;
      const authResponse = await this.authService.handleOAuthLogin(oauthUser);
      
      // Set httpOnly cookies
      const config = getConfig();
      res.cookie('access_token', authResponse.access_token, {
        httpOnly: true,
        secure: config.server.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: authResponse.expires_in * 1000, // Convert to milliseconds
      });

      res.cookie('refresh_token', authResponse.refresh_token, {
        httpOnly: true,
        secure: config.server.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend SSO completion page
      res.redirect(`${config.server.frontendUrl}/auth/sso-complete?provider=google`);
    } catch (error) {
      console.error('Google OAuth error:', error);
      const config = getConfig();
      res.redirect(`${config.server.frontendUrl}/auth/callback?error=oauth_failed&provider=google`);
    }
  }

  // OAuth Facebook endpoints
  @Get('facebook')
  @UseGuards(FacebookOAuthGuard)
  @ApiOperation({ summary: 'Initiate Facebook OAuth login' })
  @ApiResponse({ status: 200, description: 'Redirects to Facebook OAuth' })
  async facebookAuth() {
    // Guard will handle the OAuth flow
  }

  @Get('facebook/callback')
  @UseGuards(FacebookOAuthGuard)
  @ApiOperation({ summary: 'Facebook OAuth callback' })
  @ApiResponse({ status: 200, description: 'OAuth login successful', type: OAuthCallbackResponseDto })
  @ApiResponse({ status: 401, description: 'OAuth login failed', type: OAuthErrorResponseDto })
  async facebookAuthCallback(@Req() req: Request, @Res() res: Response) {
    try {
      const oauthUser = req.user as any;
      if (!oauthUser?.email) {
        return res.status(401).json({
          code: 'NO_EMAIL_FROM_FACEBOOK',
          message: 'Facebook did not return an email. Ask for email permission or collect it after login.'
        });
      }
      const authResponse = await this.authService.handleOAuthLogin(oauthUser);
      
      // Set httpOnly cookies
      const config = getConfig();
      res.cookie('access_token', authResponse.access_token, {
        httpOnly: true,
        secure: config.server.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: authResponse.expires_in * 1000, // Convert to milliseconds
      });

      res.cookie('refresh_token', authResponse.refresh_token, {
        httpOnly: true,
        secure: config.server.nodeEnv === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Redirect to frontend SSO completion page
      res.redirect(`${config.server.frontendUrl}/auth/sso-complete?provider=facebook`);
    } catch (error) {
      console.error('Facebook OAuth error:', error);
      const config = getConfig();
      res.redirect(`${config.server.frontendUrl}/auth/callback?error=oauth_failed&provider=facebook`);
    }
  }

  // Refresh token endpoint
  @Post('refresh')
  @UseGuards(RefreshGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully', type: AuthResponseDto })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(
    @CurrentUser() user: User,
    @Req() req: Request,
    @Res() res: Response
  ): Promise<void> {
    const refreshToken = req.cookies?.refresh_token || 
      req.headers.authorization?.replace('Bearer ', '');
    
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token not found');
    }

    const authResponse = await this.authService.refreshTokens(user, refreshToken);
    
    // Set new httpOnly cookies
    const config = getConfig();
    res.cookie('access_token', authResponse.access_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: authResponse.expires_in * 1000,
    });

    res.cookie('refresh_token', authResponse.refresh_token, {
      httpOnly: true,
      secure: config.server.nodeEnv === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json(authResponse);
  }

  // Logout endpoint with cookie clearing
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout user and clear cookies' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@CurrentUser() user: User, @Res() res: Response): Promise<void> {
    await this.authService.logout(user.id);
    
    // Clear cookies
    res.clearCookie('access_token');
    res.clearCookie('refresh_token');
    
    res.json({ message: 'Logout successful' });
  }
}
