import { Module } from '@nestjs/common';
import { CliController } from '@/modules/cli/cli.controller';
import { CliService } from '@/modules/cli/cli.service';

@Module({
  controllers: [CliController],
  providers: [CliService],
  exports: [CliService],
})
export class CliModule {}
