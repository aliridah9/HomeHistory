import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class OAuthUserDto {
  @ApiProperty()
  @IsString()
  email: string;

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  picture?: string;

  @ApiProperty()
  @IsString()
  accessToken: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  refreshToken?: string;

  @ApiProperty()
  @IsString()
  provider: string;

  @ApiProperty()
  @IsString()
  providerId: string;
}

export class OAuthCallbackResponseDto {
  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsString()
  redirectUrl: string;
}

export class OAuthErrorResponseDto {
  @ApiProperty()
  @IsString()
  error: string;

  @ApiProperty()
  @IsString()
  message: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  redirectUrl?: string;
}
