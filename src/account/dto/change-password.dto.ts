import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current account password',
  })
  @IsString()
  @MinLength(1)
  oldPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description: 'New password (min 8 chars, 1 uppercase, 1 lowercase, 1 number)',
  })
  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 number',
  })
  newPassword: string;
}
