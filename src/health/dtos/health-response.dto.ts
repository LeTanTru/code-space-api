import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HealthIndicatorStatusDto {
  @ApiProperty({ description: 'Status of component (up or down)', example: 'up' })
  status: string;

  @ApiPropertyOptional({
    description: 'Optional error message if component status is down',
    example: 'Connection timeout',
  })
  message?: string;
}

export class HealthCheckDataDto {
  @ApiProperty({ description: 'Overall health check status', example: 'ok' })
  status: string;

  @ApiProperty({
    description: 'Health indicators for operational components',
    example: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
    },
  })
  info?: Record<string, HealthIndicatorStatusDto>;

  @ApiProperty({
    description: 'Health indicators for failing components',
    example: {},
  })
  error?: Record<string, HealthIndicatorStatusDto>;

  @ApiProperty({
    description: 'Complete breakdown of all component indicators',
    example: {
      database: { status: 'up' },
      memory_heap: { status: 'up' },
    },
  })
  details?: Record<string, HealthIndicatorStatusDto>;
}
