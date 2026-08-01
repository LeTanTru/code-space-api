import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    example: 'developer@codespace.dev',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Account password (min 6 chars, must contain at least one uppercase letter, one lowercase letter, and one number)',
  })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    example: 'Alex Dev',
    description: 'User display name',
  })
  @IsString()
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(255, { message: 'Name must be at most 255 characters long' })
  name: string;
}
