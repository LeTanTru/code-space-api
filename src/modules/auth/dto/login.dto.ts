import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'developer@codespace.dev',
    description: 'User email address',
  })
  @IsString()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Account password',
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiPropertyOptional({
    example: 'Windows Workstation Desktop',
    description: 'Client device name or user agent identifier',
  })
  @IsOptional()
  @IsString()
  deviceName?: string;
}
