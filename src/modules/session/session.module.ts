import { Module } from '@nestjs/common';
import { SessionController } from '@/modules/session/session.controller';
import { SessionService } from '@/modules/session/session.service';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [SessionController],
  providers: [SessionService],
  exports: [SessionService],
})
export class SessionModule {}
