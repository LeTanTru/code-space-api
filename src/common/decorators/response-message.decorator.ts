import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Decorator to set a custom success message on any route handler.
 * The ResponseInterceptor reads this metadata and uses it as the response message.
 *
 * @example
 * @ResponseMessage('Logged in successfully')
 * async login(...) {}
 */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE_KEY, message);
