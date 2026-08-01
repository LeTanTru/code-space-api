import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @ApiProperty({
    example: 'OldPassword123!',
    description: 'Current account password',
  })
  @IsString()
  @MinLength(1, { message: 'Current password is required' })
  oldPassword: string;

  @ApiProperty({
    example: 'NewPassword123!',
    description:
      'New password (min 6 chars, must contain at least one uppercase letter, one lowercase letter, and one number)',
  })
  @IsString()
  @MinLength(6, { message: 'New password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'New password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  newPassword: string;
}
