import { Module } from '@nestjs/common';
import { AccountController } from '@/modules/account/account.controller';
import { AccountService } from '@/modules/account/account.service';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { SessionModule } from '@/modules/session/session.module';

@Module({
  imports: [PrismaModule, AuthModule, SessionModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
