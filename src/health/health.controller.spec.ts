import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckService, MemoryHealthIndicator } from '@nestjs/terminus';
import { HealthController } from '@/health/health.controller';
import { PrismaService } from '@/prisma/prisma.service';

describe('HealthController', () => {
  let controller: HealthController;
  let healthService: HealthCheckService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: {
            check: jest.fn().mockImplementation((indicators) =>
              Promise.all(indicators.map((fn: () => any) => fn())).then((results) => ({
                status: 'ok',
                info: Object.assign({}, ...results),
                error: {},
                details: Object.assign({}, ...results),
              }))
            ),
          },
        },
        {
          provide: MemoryHealthIndicator,
          useValue: {
            checkHeap: jest.fn().mockReturnValue({ memory_heap: { status: 'up' } }),
          },
        },
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
          },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    healthService = module.get<HealthCheckService>(HealthCheckService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return health check ok result', async () => {
    const result = await controller.check();
    expect(result.status).toBe('ok');
    expect(result.info?.database?.status).toBe('up');
    expect(result.info?.memory_heap?.status).toBe('up');
  });
});
