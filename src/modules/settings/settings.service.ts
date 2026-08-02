import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { UserSettings } from '@prisma/client';
import { SettingsResponseDto } from '@/modules/settings/dto/settings-response.dto';
import { UpdateSettingsDto } from '@/modules/settings/dto/update-settings.dto';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieves user settings, automatically initializing default settings if none exist.
   */
  async getSettings(userId: string): Promise<SettingsResponseDto> {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });

    return this.mapToResponseDto(settings);
  }

  /**
   * Updates user settings with partial payload.
   */
  async updateSettings(userId: string, dto: UpdateSettingsDto): Promise<SettingsResponseDto> {
    const settings = await this.prisma.userSettings.upsert({
      where: { userId },
      update: {
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.font !== undefined && { font: dto.font }),
        ...(dto.tabOrientation !== undefined && { tabOrientation: dto.tabOrientation }),
        ...(dto.terminalFontSize !== undefined && { terminalFontSize: dto.terminalFontSize }),
        ...(dto.terminalCursorStyle !== undefined && {
          terminalCursorStyle: dto.terminalCursorStyle,
        }),
        ...(dto.terminalCursorBlink !== undefined && {
          terminalCursorBlink: dto.terminalCursorBlink,
        }),
        ...(dto.defaultDirectory !== undefined && { defaultDirectory: dto.defaultDirectory }),
        ...(dto.soundNotifications !== undefined && {
          soundNotifications: dto.soundNotifications,
        }),
        ...(dto.desktopNotifications !== undefined && {
          desktopNotifications: dto.desktopNotifications,
        }),
        ...(dto.selectedSoundId !== undefined && { selectedSoundId: dto.selectedSoundId }),
        ...(dto.autoRestoreSession !== undefined && {
          autoRestoreSession: dto.autoRestoreSession,
        }),
      },
      create: {
        userId,
        ...dto,
      },
    });

    this.logger.log(`Settings updated for user ${userId}`);
    return this.mapToResponseDto(settings);
  }

  private mapToResponseDto(settings: UserSettings): SettingsResponseDto {
    return {
      theme: settings.theme,
      font: settings.font,
      tabOrientation: settings.tabOrientation,
      terminalFontSize: settings.terminalFontSize,
      terminalCursorStyle: settings.terminalCursorStyle,
      terminalCursorBlink: settings.terminalCursorBlink,
      defaultDirectory: settings.defaultDirectory,
      soundNotifications: settings.soundNotifications,
      desktopNotifications: settings.desktopNotifications,
      selectedSoundId: settings.selectedSoundId,
      autoRestoreSession: settings.autoRestoreSession,
      updatedAt: settings.updatedAt,
    };
  }
}
