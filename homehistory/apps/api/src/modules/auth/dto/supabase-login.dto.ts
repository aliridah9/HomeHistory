import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SupabaseLoginDto {
  @ApiProperty({ description: 'Supabase authentication token' })
  @IsString()
  token: string;
}
