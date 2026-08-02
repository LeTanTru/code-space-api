import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  CreatePresetDto,
  UpdatePresetDto,
  PresetResponseDto,
} from '@/modules/preset/dto/preset.dto';

type FormattedPreset = PresetResponseDto;

@Injectable()
export class PresetService {
  constructor(private readonly prisma: PrismaService) {}

  private formatPreset(preset: any): FormattedPreset {
    const layoutObj = (preset.layout as Record<string, any>) || {};
    return {
      id: preset.id,
      userId: preset.userId,
      name: preset.name,
      description: preset.description,
      count: preset.terminalCount,
      orientation: layoutObj.orientation || 'horizontal',
      cliIds: layoutObj.cliIds || [],
      createdAt: Number(preset.createdAt),
      updatedAt: Number(preset.updatedAt),
    };
  }

  async getPresets(userId: string): Promise<FormattedPreset[]> {
    const presets = await this.prisma.workspacePreset.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return presets.map((p) => this.formatPreset(p));
  }

  async getPresetById(userId: string, id: string): Promise<FormattedPreset> {
    const preset = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
    });
    if (!preset) {
      throw new NotFoundException('Preset not found');
    }
    return this.formatPreset(preset);
  }

  async createPreset(userId: string, dto: CreatePresetDto): Promise<FormattedPreset> {
    const now = Date.now();
    const layout = {
      orientation: dto.orientation || 'horizontal',
      cliIds: dto.cliIds || [],
    };

    const preset = await this.prisma.workspacePreset.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        rootPath: '',
        terminalCount: dto.count ?? 1,
        layout: layout as any,
        createdAt: BigInt(now),
        updatedAt: BigInt(now),
      },
    });

    return this.formatPreset(preset);
  }

  async updatePreset(userId: string, id: string, dto: UpdatePresetDto): Promise<FormattedPreset> {
    const existing = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Preset not found');
    }

    const now = Date.now();
    const existingLayout = (existing.layout as Record<string, any>) || {};
    const updatedLayout = {
      ...existingLayout,
      ...(dto.orientation ? { orientation: dto.orientation } : {}),
      ...(dto.cliIds ? { cliIds: dto.cliIds } : {}),
    };

    const updated = await this.prisma.workspacePreset.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        terminalCount: dto.count,
        layout: updatedLayout as any,
        updatedAt: BigInt(now),
      },
    });

    return this.formatPreset(updated);
  }

  async deletePreset(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Preset not found');
    }
    await this.prisma.workspacePreset.delete({ where: { id } });
  }
}
