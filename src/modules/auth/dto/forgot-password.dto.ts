import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'developer@codespace.dev',
    description: 'Email address of the account requesting a password reset',
  })
  @IsEmail({}, { message: 'Must be a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}
