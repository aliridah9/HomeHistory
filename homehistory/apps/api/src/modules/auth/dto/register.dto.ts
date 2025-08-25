import { IsEmail, IsString, MinLength, IsOptional, Matches, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email address' })
  @IsEmail()
  email: string;

  @ApiProperty({ 
    example: 'SecurePass123!', 
    description: 'Password must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character',
    minLength: 8 
  })
  @IsString()
  @MinLength(8)
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    { message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character' }
  )
  password: string;

  @ApiProperty({ example: 'John Doe', description: 'User full name', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: '+1234567890', description: 'User phone number', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'John', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'AGENT', required: false, enum: ['AGENT','LANDLORD','LENDER','CONTRACTOR'] })
  @IsOptional()
  @IsIn(['AGENT','LANDLORD','LENDER','CONTRACTOR'])
  professionalType?: 'AGENT' | 'LANDLORD' | 'LENDER' | 'CONTRACTOR';
}
