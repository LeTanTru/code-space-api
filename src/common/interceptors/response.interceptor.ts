import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_STATUS, RESPONSE_MESSAGES, API_META_DEFAULTS } from '@/constants/response';

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
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseEnvelope<T>> {
    return next.handle().pipe(
      map((response) => {
        // If response already matches response envelope structure, pass through
        if (response && response.status === RESPONSE_STATUS.SUCCESS && 'data' in response) {
          return {
            ...response,
            meta: response.meta || {
              timestamp: Date.now(),
              version: API_META_DEFAULTS.VERSION,
            },
          };
        }

        return {
          status: RESPONSE_STATUS.SUCCESS,
          data: response,
          message: RESPONSE_MESSAGES.MUTATION_SUCCESS,
          meta: {
            timestamp: Date.now(),
            version: API_META_DEFAULTS.VERSION,
          },
        };
      })
    );
  }
}
