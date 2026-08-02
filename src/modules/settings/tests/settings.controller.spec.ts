import { Test, TestingModule } from '@nestjs/testing';
import { SettingsController } from '@/modules/settings/settings.controller';
import { SettingsService } from '@/modules/settings/settings.service';
import { TabOrientation, TerminalCursorStyle } from '@prisma/client';

describe('SettingsController', () => {
  let controller: SettingsController;
  let service: {
    getSettings: jest.Mock;
    updateSettings: jest.Mock;
  };

  const mockSettingsResponse = {
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

  const mockReq = {
    user: {
      id: 'user-uuid-1',
      email: 'developer@codespace.dev',
      role: 'USER',
    },
  } as any;

  beforeEach(async () => {
    service = {
      getSettings: jest.fn().mockResolvedValue(mockSettingsResponse),
      updateSettings: jest.fn().mockResolvedValue(mockSettingsResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: service }],
    }).compile();

    controller = module.get<SettingsController>(SettingsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getSettings', () => {
    it('should return user settings for authenticated user', async () => {
      const result = await controller.getSettings(mockReq);

      expect(service.getSettings).toHaveBeenCalledWith('user-uuid-1');
      expect(result).toEqual(mockSettingsResponse);
    });
  });

  describe('updateSettings', () => {
    it('should update user settings for authenticated user', async () => {
      const dto = { theme: 'dracula', terminalFontSize: 16 };
      const updatedResponse = { ...mockSettingsResponse, ...dto };
      service.updateSettings.mockResolvedValue(updatedResponse);

      const result = await controller.updateSettings(mockReq, dto);

      expect(service.updateSettings).toHaveBeenCalledWith('user-uuid-1', dto);
      expect(result.theme).toBe('dracula');
      expect(result.terminalFontSize).toBe(16);
    });
  });
});
