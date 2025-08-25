import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '@homehistory/database';

export class UserProfileDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address', nullable: true })
  email: string | null;

  @ApiProperty({ description: 'User full name', nullable: true })
  name: string | null;

  @ApiProperty({ description: 'User avatar URL', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ description: 'User role', enum: UserRole })
  role: UserRole;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last profile update' })
  updatedAt: Date;

  @ApiProperty({ description: 'User phone number', nullable: true })
  phone?: string | null;

  @ApiProperty({ description: 'Email verification status' })
  emailVerified?: boolean;

  @ApiProperty({ description: 'User preferences', nullable: true })
  preferences?: any;
}
