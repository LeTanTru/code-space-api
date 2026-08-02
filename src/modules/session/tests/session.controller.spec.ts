import { Test, TestingModule } from '@nestjs/testing';
import { SessionController } from '@/modules/session/session.controller';
import { SessionService } from '@/modules/session/session.service';

describe('SessionController', () => {
  let controller: SessionController;
  let sessionService: SessionService;

  const mockSessions = [
    {
      id: '10',
      deviceName: 'Windows PC',
      userAgent: 'Mozilla/5.0',
      createdAt: new Date('2026-08-01T11:45:00.000Z'),
      expiresAt: new Date('2026-08-08T11:45:00.000Z'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SessionController],
      providers: [
        {
          provide: SessionService,
          useValue: {
            getSessions: jest.fn().mockResolvedValue(mockSessions),
            revokeSession: jest.fn().mockResolvedValue(undefined),
          },
        },
      ],
    }).compile();

    controller = module.get<SessionController>(SessionController);
    sessionService = module.get<SessionService>(SessionService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSessions', () => {
    it('should return active logged-in device sessions list', async () => {
      const mockReq: any = { user: { id: '1' } };
      const result = await controller.getSessions(mockReq);

      expect(sessionService.getSessions).toHaveBeenCalledWith('1', undefined);
      expect(result).toEqual(mockSessions);
    });
  });

  describe('revokeSession', () => {
    it('should delegate session revocation with JWT user ID scope', async () => {
      const mockReq: any = { user: { id: '1' } };
      await controller.revokeSession('10', mockReq);

      expect(sessionService.revokeSession).toHaveBeenCalledWith('1', '10');
    });
  });
});
