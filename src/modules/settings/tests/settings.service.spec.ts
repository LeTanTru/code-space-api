import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from '@/modules/settings/settings.service';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { TabOrientation, TerminalCursorStyle } from '@prisma/client';

describe('SettingsService', () => {
  let service: SettingsService;
  let prismaService: {
    userSettings: {
      upsert: jest.Mock;
    };
  };

  const mockSettings = {
    id: 'setting-uuid-1',
    userId: 'user-uuid-1',
    theme: 'cyberpunk',
    font: 'inter',
    tabOrientation: TabOrientation.horizontal,
    terminalFontSize: 14,
    terminalCursorStyle: TerminalCursorStyle.block,
    terminalCursorBlink: true,
    defaultDirectory: 'd:/CODE/Web/Projects',
    soundNotifications: true,
    desktopNotifications: true,
    selectedSoundId: 'default',
    autoRestoreSession: true,
    updatedAt: new Date('2026-08-02T09:00:00.000Z'),
  };

  beforeEach(async () => {
    prismaService = {
      userSettings: {
        upsert: jest.fn().mockResolvedValue(mockSettings),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [SettingsService, { provide: PrismaService, useValue: prismaService }],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSettings', () => {
    it('should upsert and return user settings', async () => {
      const result = await service.getSettings('user-uuid-1');

      expect(prismaService.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        update: {},
        create: { userId: 'user-uuid-1' },
      });
      expect(result.theme).toBe('cyberpunk');
      expect(result.font).toBe('inter');
      expect(result.terminalFontSize).toBe(14);
    });
  });

  describe('updateSettings', () => {
    it('should update user settings with partial payload', async () => {
      const dto = {
        theme: 'dracula',
        terminalFontSize: 16,
      };

      prismaService.userSettings.upsert.mockResolvedValue({
        ...mockSettings,
        ...dto,
      });

      const result = await service.updateSettings('user-uuid-1', dto);

      expect(prismaService.userSettings.upsert).toHaveBeenCalledWith({
        where: { userId: 'user-uuid-1' },
        update: expect.objectContaining({
          theme: 'dracula',
          terminalFontSize: 16,
        }),
        create: expect.objectContaining({
          userId: 'user-uuid-1',
          theme: 'dracula',
          terminalFontSize: 16,
        }),
      });
      expect(result.theme).toBe('dracula');
      expect(result.terminalFontSize).toBe(16);
    });
  });
});
