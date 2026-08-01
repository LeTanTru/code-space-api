import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MemoryHealthIndicator,
  HealthCheckResult,
} from '@nestjs/terminus';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { ApiSingleResponse } from '@/common/decorators/swagger-response.decorator';
import { ResponseMessage } from '@/common/decorators/response-message.decorator';
import { HealthCheckDataDto } from '@/modules/health/dtos/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly memory: MemoryHealthIndicator,
    private readonly prisma: PrismaService
  ) {}

  @Get()
  @HealthCheck()
  @ResponseMessage('Check health successfully')
  @ApiOperation({ summary: 'Check API and Database health status' })
  @ApiSingleResponse(HealthCheckDataDto)
  async check(): Promise<HealthCheckResult> {
    return this.health.check([
      // Database connection indicator
      async () => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: (error as Error).message,
            },
          };
        }
      },
      // Heap memory usage indicator (< 300MB)
      () => this.memory.checkHeap('memory_heap', 300 * 1024 * 1024),
    ]);
  }
}
