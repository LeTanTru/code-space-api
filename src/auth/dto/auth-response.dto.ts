import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: '1', description: 'User ID' })
  id: string;

  @ApiProperty({ example: 'developer@codespace.dev', description: 'User email' })
  email: string;

  @ApiProperty({ example: 'Alex Dev', description: 'User display name' })
  name: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.png', description: 'Avatar URL' })
  avatarUrl?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.USER, description: 'User system role' })
  role: UserRole;
}

export class SessionResponseDto {
  @ApiProperty({ example: '1', description: 'Session ID' })
  id: string;

  @ApiPropertyOptional({ example: 'Windows Desktop Workstation', description: 'Device name' })
  deviceName?: string | null;

  @ApiPropertyOptional({ example: 'Mozilla/5.0 (Windows NT 10.0)', description: 'HTTP User Agent' })
  userAgent?: string | null;

  @ApiPropertyOptional({ example: '127.0.0.1', description: 'Client IP address' })
  ipAddress?: string | null;

  @ApiProperty({ example: '2026-08-01T11:45:00.000Z', description: 'Session creation timestamp' })
  createdAt: Date;

  @ApiProperty({ example: '2026-08-08T11:45:00.000Z', description: 'Session expiration timestamp' })
  expiresAt: Date;
}

export class UserMeResponseDto extends UserResponseDto {
  @ApiProperty({
    type: [SessionResponseDto],
    description: 'List of active logged-in device sessions',
  })
  activeSessions: SessionResponseDto[];
}

export class LoginResponseDataDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
    description: 'JWT Access Token',
  })
  accessToken: string;

  @ApiProperty({ example: 'Bearer', description: 'Token authorization type' })
  tokenType: string;

  @ApiProperty({ example: 900, description: 'Access token expiration in seconds' })
  expiresIn: number;

  @ApiProperty({ type: () => UserResponseDto, description: 'User profile metadata' })
  user: UserResponseDto;
}
