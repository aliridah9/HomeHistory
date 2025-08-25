import { IsEmail, IsOptional, IsPhoneNumber, ValidateIf } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class AuthLookupDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+14155552671', description: 'E.164 formatted phone' })
  @IsOptional()
  @ValidateIf((o) => !o.email)
  @IsPhoneNumber()
  phone?: string;
}

export type LookupResponse = {
  exists: boolean;
  userId?: string;
  providers: Array<'password' | 'google' | 'facebook'>;
};


