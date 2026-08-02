import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/modules/prisma/prisma.service';
import {
  CreateCliToolDto,
  UpdateCliToolDto,
  UpsertCliOverrideDto,
  CliToolsListResponseDto,
  CustomCliItemDto,
  CliOverrideItemDto,
} from '@/modules/cli/dto/cli.dto';

@Injectable()
export class CliService {
  constructor(private readonly prisma: PrismaService) {}

  async getCliTools(userId: string): Promise<CliToolsListResponseDto> {
    const customClis = await this.prisma.cliTool.findMany({
      where: { userId, isCustom: true },
      orderBy: { createdAt: 'desc' },
    });

    const overrides = await this.prisma.cliBuiltinOverride.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });

    return {
      customClis: customClis.map((c) => ({
        id: c.id,
        name: c.name,
        command: c.command,
        checkCommand: c.checkCommand,
        link: c.link,
        isCustom: c.isCustom,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
      })),
      builtinOverrides: overrides.map((o) => ({
        id: o.id,
        cliId: o.cliId,
        name: o.name,
        command: o.command,
        checkCommand: o.checkCommand,
        link: o.link,
        updatedAt: o.updatedAt,
      })),
    };
  }

  async createCustomCli(userId: string, dto: CreateCliToolDto): Promise<CustomCliItemDto> {
    const created = await this.prisma.cliTool.create({
      data: {
        userId,
        name: dto.name,
        command: dto.command,
        checkCommand: dto.checkCommand,
        link: dto.link,
        isCustom: true,
      },
    });

    return {
      id: created.id,
      name: created.name,
      command: created.command,
      checkCommand: created.checkCommand,
      link: created.link,
      isCustom: created.isCustom,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  async updateCustomCli(
    userId: string,
    id: string,
    dto: UpdateCliToolDto
  ): Promise<CustomCliItemDto> {
    const existing = await this.prisma.cliTool.findFirst({
      where: { id, userId, isCustom: true },
    });
    if (!existing) {
      throw new NotFoundException('CLI tool not found');
    }

    const updated = await this.prisma.cliTool.update({
      where: { id },
      data: {
        name: dto.name,
        command: dto.command,
        checkCommand: dto.checkCommand,
        link: dto.link,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      command: updated.command,
      checkCommand: updated.checkCommand,
      link: updated.link,
      isCustom: updated.isCustom,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  async deleteCustomCli(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.cliTool.findFirst({
      where: { id, userId, isCustom: true },
    });
    if (!existing) {
      throw new NotFoundException('CLI tool not found');
    }
    await this.prisma.cliTool.delete({ where: { id } });
  }

  async upsertCliOverride(userId: string, dto: UpsertCliOverrideDto): Promise<CliOverrideItemDto> {
    const override = await this.prisma.cliBuiltinOverride.upsert({
      where: {
        userId_cliId: {
          userId,
          cliId: dto.cliId,
        },
      },
      create: {
        userId,
        cliId: dto.cliId,
        name: dto.name,
        command: dto.command,
        checkCommand: dto.checkCommand,
        link: dto.link,
      },
      update: {
        name: dto.name,
        command: dto.command,
        checkCommand: dto.checkCommand,
        link: dto.link,
      },
    });

    return {
      id: override.id,
      cliId: override.cliId,
      name: override.name,
      command: override.command,
      checkCommand: override.checkCommand,
      link: override.link,
      updatedAt: override.updatedAt,
    };
  }

  async deleteCliOverride(userId: string, cliId: string): Promise<void> {
    const existing = await this.prisma.cliBuiltinOverride.findUnique({
      where: {
        userId_cliId: {
          userId,
          cliId,
        },
      },
    });
    if (!existing) {
      throw new NotFoundException('CLI override not found');
    }
    await this.prisma.cliBuiltinOverride.delete({
      where: {
        userId_cliId: {
          userId,
          cliId,
        },
      },
    });
  }
}
