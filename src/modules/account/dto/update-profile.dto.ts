import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({
    example: 'Alex Dev',
    description: 'Updated display name (min 2, max 255 chars)',
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.png',
    description: 'Updated avatar image URL',
  })
  @IsOptional()
  @IsUrl()
  @MaxLength(1024)
  avatarUrl?: string;
}
