import { ApiProperty } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email' })
  email: string;

  @ApiProperty({ description: 'User first name', required: false })
  firstName?: string;

  @ApiProperty({ description: 'User last name', required: false })
  lastName?: string;

  @ApiProperty({ description: 'User role' })
  role: string;

  @ApiProperty({ description: 'User avatar URL', required: false })
  avatarUrl?: string;

  @ApiProperty({ description: 'User creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'User last update date' })
  updatedAt: Date;
}
