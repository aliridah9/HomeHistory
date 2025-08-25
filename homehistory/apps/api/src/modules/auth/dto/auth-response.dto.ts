import { ApiProperty } from '@nestjs/swagger';
import { UserProfileDto } from './user-profile.dto';

export class AuthResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  access_token: string;

  @ApiProperty({ description: 'Refresh token', required: false })
  refresh_token?: string;

  @ApiProperty({ description: 'Token type', example: 'Bearer' })
  token_type: string = 'Bearer';

  @ApiProperty({ description: 'Token expiration time in seconds', example: 3600 })
  expires_in: number;

  @ApiProperty({ description: 'User profile information', type: UserProfileDto })
  user: UserProfileDto;
}
