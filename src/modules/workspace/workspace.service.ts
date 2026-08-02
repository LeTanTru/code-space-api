import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  CreateWorkspaceDto,
  UpdateWorkspaceDto,
  WorkspaceResponseDto,
} from '@/modules/workspace/dto/workspace.dto';

type FormattedWorkspace = WorkspaceResponseDto;

@Injectable()
export class WorkspaceService {
  constructor(private readonly prisma: PrismaService) {}

  private formatWorkspace(preset: any): FormattedWorkspace {
    return {
      id: preset.id,
      userId: preset.userId,
      name: preset.name,
      description: preset.description,
      color: preset.color,
      rootPath: preset.rootPath,
      terminalCount: preset.terminalCount,
      selectedCli: preset.selectedCli,
      ideVscode: preset.ideVscode,
      ideAntigravity: preset.ideAntigravity,
      layout: preset.layout,
      createdAt: Number(preset.createdAt),
      updatedAt: Number(preset.updatedAt),
      terminals: preset.terminals?.map((t: any) => ({
        id: t.id,
        cli: t.cli,
        cwd: t.cwd,
        customTitle: t.customTitle,
        command: t.command,
        position: t.position,
      })),
    };
  }

  async getWorkspaces(userId: string): Promise<FormattedWorkspace[]> {
    const presets = await this.prisma.workspacePreset.findMany({
      where: { userId },
      include: { terminals: { orderBy: { position: 'asc' } } },
      orderBy: { updatedAt: 'desc' },
    });
    return presets.map((p) => this.formatWorkspace(p));
  }

  async getWorkspaceById(userId: string, id: string): Promise<FormattedWorkspace> {
    const preset = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
      include: { terminals: { orderBy: { position: 'asc' } } },
    });
    if (!preset) {
      throw new NotFoundException('Workspace not found');
    }
    return this.formatWorkspace(preset);
  }

  private async ensureCliToolExists(cliId?: string | null): Promise<string | null> {
    if (!cliId) return null;

    const existing = await this.prisma.cliTool.findUnique({
      where: { id: cliId },
    });

    if (existing) return existing.id;

    try {
      const created = await this.prisma.cliTool.create({
        data: {
          id: cliId,
          name: cliId,
          command: cliId,
          isCustom: false,
        },
      });
      return created.id;
    } catch {
      const fallback = await this.prisma.cliTool.findUnique({ where: { id: cliId } });
      return fallback?.id ?? null;
    }
  }

  async createWorkspace(userId: string, dto: CreateWorkspaceDto): Promise<FormattedWorkspace> {
    const now = Date.now();
    const validSelectedCli = await this.ensureCliToolExists(dto.selectedCli);

    const terminalsToCreate: Array<{
      cli?: string | null;
      cwd: string;
      customTitle?: string;
      command?: string;
      position: number;
    }> = [];
    if (dto.terminals && dto.terminals.length > 0) {
      for (let index = 0; index < dto.terminals.length; index++) {
        const t = dto.terminals[index];
        const validTerminalCli = await this.ensureCliToolExists(t.cli);
        terminalsToCreate.push({
          cli: validTerminalCli,
          cwd: t.cwd,
          customTitle: t.customTitle,
          command: t.command,
          position: t.position ?? index,
        });
      }
    }

    const preset = await this.prisma.workspacePreset.create({
      data: {
        userId,
        name: dto.name,
        description: dto.description,
        color: dto.color ?? '#6366f1',
        rootPath: dto.rootPath,
        terminalCount: dto.terminalCount ?? 1,
        selectedCli: validSelectedCli,
        ideVscode: dto.ideVscode ?? false,
        ideAntigravity: dto.ideAntigravity ?? false,
        layout: dto.layout ? (dto.layout as any) : undefined,
        createdAt: BigInt(now),
        updatedAt: BigInt(now),
        terminals: terminalsToCreate.length > 0 ? { create: terminalsToCreate } : undefined,
      },
      include: { terminals: { orderBy: { position: 'asc' } } },
    });
    return this.formatWorkspace(preset);
  }

  async updateWorkspace(
    userId: string,
    id: string,
    dto: UpdateWorkspaceDto
  ): Promise<FormattedWorkspace> {
    const existing = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Workspace not found');
    }

    const now = Date.now();
    const validSelectedCli =
      dto.selectedCli !== undefined ? await this.ensureCliToolExists(dto.selectedCli) : undefined;

    let terminalsData: any = undefined;
    if (dto.terminals !== undefined) {
      await this.prisma.presetTerminal.deleteMany({ where: { presetId: id } });

      const updatedTerminals: Array<{
        cli?: string | null;
        cwd: string;
        customTitle?: string;
        command?: string;
        position: number;
      }> = [];
      for (let index = 0; index < dto.terminals.length; index++) {
        const t = dto.terminals[index];
        const validTerminalCli = await this.ensureCliToolExists(t.cli);
        updatedTerminals.push({
          cli: validTerminalCli,
          cwd: t.cwd,
          customTitle: t.customTitle,
          command: t.command,
          position: t.position ?? index,
        });
      }
      terminalsData = { create: updatedTerminals };
    }

    const updated = await this.prisma.workspacePreset.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        color: dto.color,
        rootPath: dto.rootPath,
        terminalCount: dto.terminalCount,
        selectedCli: validSelectedCli,
        ideVscode: dto.ideVscode,
        ideAntigravity: dto.ideAntigravity,
        layout: dto.layout ? (dto.layout as any) : undefined,
        updatedAt: BigInt(now),
        terminals: terminalsData,
      },
      include: { terminals: { orderBy: { position: 'asc' } } },
    });

    return this.formatWorkspace(updated);
  }

  async deleteWorkspace(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.workspacePreset.findFirst({
      where: { id, userId },
    });
    if (!existing) {
      throw new NotFoundException('Workspace not found');
    }
    await this.prisma.workspacePreset.delete({ where: { id } });
  }
}
