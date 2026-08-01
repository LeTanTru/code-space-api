import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'developer@codespace.dev',
    description: 'Email address of the account being reset',
  })
  @IsEmail({}, { message: 'Please enter a valid email address' })
  @IsNotEmpty({ message: 'Email address is required' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code received via email',
  })
  @IsString()
  @Length(6, 6, { message: 'Verification code must be exactly 6 digits' })
  code: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'New account password (min 6 chars, must contain at least one uppercase letter, one lowercase letter, and one number)',
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
