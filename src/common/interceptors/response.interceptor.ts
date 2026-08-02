import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Request } from 'express';
import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator';
import { RESPONSE_STATUS, API_META_DEFAULTS } from '@/constants/response';

export type ResponseEnvelope<T> = {
  status: string;
  data?: T;
  message?: string;
  meta: {
    timestamp: number;
    version: string;
    path?: string;
  };
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    // Read per-route @ResponseMessage() metadata
    const message = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest<Request>();
    const path = request?.originalUrl || request?.url;

    return next.handle().pipe(
      map((response) => {
        let finalMessage = message;
        let responseData = response;

        if (response && typeof response === 'object' && !Array.isArray(response)) {
          if ('message' in response && typeof response.message === 'string') {
            if (!finalMessage) {
              finalMessage = response.message;
            }
            const { message: _msg, ...rest } = response;
            responseData = Object.keys(rest).length > 0 ? rest : null;
          }
        }

        // If response already matches response envelope structure, pass through
        if (response && response.status === RESPONSE_STATUS.SUCCESS && 'data' in response) {
          return {
            ...response,
            ...(finalMessage ? { message: finalMessage } : {}),
            meta: {
              timestamp: Date.now(),
              version: API_META_DEFAULTS.VERSION,
              path,
              ...response.meta,
            },
          };
        }

        const envelope: Record<string, any> = {
          status: RESPONSE_STATUS.SUCCESS,
        };

        if (responseData !== null && responseData !== undefined) {
          envelope.data = responseData;
        }

        if (finalMessage) {
          envelope.message = finalMessage;
        }

        envelope.meta = {
          timestamp: Date.now(),
          version: API_META_DEFAULTS.VERSION,
          path,
        };

        return envelope as ResponseEnvelope<T>;
      })
    );
  }
}
