import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { HealthModule } from '@/modules/health/health.module';
import { AuthModule } from '@/modules/auth/auth.module';
import { AccountModule } from '@/modules/account/account.module';
import { SessionModule } from '@/modules/session/session.module';
import { SettingsModule } from '@/modules/settings/settings.module';
import { UploadModule } from '@/modules/upload/upload.module';
import { WorkspaceModule } from '@/modules/workspace/workspace.module';
import { PresetModule } from '@/modules/preset/preset.module';
import { CliModule } from '@/modules/cli/cli.module';
import { DirectoryHistoryModule } from '@/modules/directory-history/directory-history.module';
import { SyncModule } from '@/modules/sync/sync.module';
import { ResponseInterceptor } from '@/common/interceptors/response.interceptor';
import { ONE_MINUTE_IN_MS } from '@/constants/time';

@Module({
  imports: [
    // Environment Variables Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.development.local', '.env.local', '.env'],
    }),

    // Structured Pino HTTP Logger
    LoggerModule.forRoot({
      pinoHttp: {
        transport:
          process.env.NODE_ENV !== 'production'
            ? {
                target: 'pino-pretty',
                options: {
                  singleLine: true,
                  colorize: true,
                },
              }
            : undefined,
        level: process.env.LOG_LEVEL || 'info',
      },
    }),

    // Global Rate Limiter Configuration
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', ONE_MINUTE_IN_MS),
          limit: config.get<number>('THROTTLE_LIMIT', 60),
        },
      ],
    }),

    // Database & Feature Modules
    PrismaModule,
    HealthModule,
    AuthModule,
    AccountModule,
    SessionModule,
    SettingsModule,
    UploadModule,
    WorkspaceModule,
    PresetModule,
    CliModule,
    DirectoryHistoryModule,
    SyncModule,
  ],
  providers: [
    // Global Response Interceptor (DI-aware, supports @ResponseMessage() decorator)
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    // Global Throttler Rate Limiter Guard
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
