import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '@/common/decorators/response-message.decorator';
import { RESPONSE_STATUS, API_META_DEFAULTS } from '@/constants/response';

export type ResponseEnvelope<T> = {
  status: string;
  data: T;
  message?: string;
  meta: {
    timestamp: number;
    version: string;
  };
};

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseEnvelope<T>> {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    // Read per-route @ResponseMessage() metadata, falling back to default
    const customMessage = this.reflector.getAllAndOverride<string>(RESPONSE_MESSAGE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const message = customMessage || 'Operation completed successfully';

    return next.handle().pipe(
      map((response) => {
        // If response already matches response envelope structure, pass through
        if (response && response.status === RESPONSE_STATUS.SUCCESS && 'data' in response) {
          return {
            ...response,
            message: response.message || message,
            meta: response.meta || {
              timestamp: Date.now(),
              version: API_META_DEFAULTS.VERSION,
            },
          };
        }

        return {
          status: RESPONSE_STATUS.SUCCESS,
          data: response,
          message,
          meta: {
            timestamp: Date.now(),
            version: API_META_DEFAULTS.VERSION,
          },
        };
      })
    );
  }
}
