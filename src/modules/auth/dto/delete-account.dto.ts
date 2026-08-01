import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class DeleteAccountDto {
  @ApiProperty({
    example: 'Password123!',
    description: 'Current account password — required to confirm deletion',
  })
  @IsString()
  @MinLength(1)
  password: string;
}
