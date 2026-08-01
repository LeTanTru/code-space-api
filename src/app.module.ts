import { Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { PrismaModule } from '@/prisma/prisma.module';
import { HealthModule } from '@/health/health.module';
import { AuthModule } from '@/auth/auth.module';
import { AccountModule } from '@/account/account.module';
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
