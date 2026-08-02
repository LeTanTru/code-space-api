import { Module } from '@nestjs/common';
import { PresetController } from '@/modules/preset/preset.controller';
import { PresetService } from '@/modules/preset/preset.service';

@Module({
  controllers: [PresetController],
  providers: [PresetService],
  exports: [PresetService],
})
export class PresetModule {}
