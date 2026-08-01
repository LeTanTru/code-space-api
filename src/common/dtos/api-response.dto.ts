import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_DEFAULTS } from '@/constants/pagination';
import { RESPONSE_STATUS, API_META_DEFAULTS } from '@/constants/response';

export class ResponseMetaDto {
  @ApiProperty({ description: 'Response timestamp in milliseconds', example: 1785500000000 })
  timestamp: number;

  @ApiProperty({ description: 'API version identifier', example: API_META_DEFAULTS.VERSION })
  version: string;

  @ApiPropertyOptional({ description: 'Request URL path', example: '/api/v1/endpoint' })
  path?: string;
}

export class PaginationMetaDto extends ResponseMetaDto {
  @ApiProperty({ description: 'Total number of items available', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number (1-based)', example: PAGINATION_DEFAULTS.PAGE })
  page: number;

  @ApiProperty({ description: 'Number of items per page', example: PAGINATION_DEFAULTS.LIMIT })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Whether a next page exists', example: true })
  hasNextPage: boolean;

  @ApiProperty({ description: 'Whether a previous page exists', example: false })
  hasPreviousPage: boolean;
}

/**
 * 1. Single Query Response DTO
 * Used for fetching a single resource by ID or singleton state.
 */
export class SingleResponseDto<T> {
  @ApiProperty({ description: 'Response status indicator', example: RESPONSE_STATUS.SUCCESS })
  status: string;

  @ApiProperty({ description: 'Data payload for single resource query' })
  data: T;

  @ApiPropertyOptional({
    description: 'Human-readable response message',
  })
  message?: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(data: T, message?: string) {
    this.status = RESPONSE_STATUS.SUCCESS;
    this.data = data;
    if (message) {
      this.message = message;
    }
    this.meta = {
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}

/**
 * 2. List Query Response DTO (Paginated / Collection)
 * Used for listing arrays of items with metadata and pagination.
 */
export class ListResponseDto<T> {
  @ApiProperty({ description: 'Response status indicator', example: RESPONSE_STATUS.SUCCESS })
  status: string;

  @ApiProperty({ description: 'Array of data items for list resource query', isArray: true })
  data: T[];

  @ApiPropertyOptional({
    description: 'Human-readable response message',
  })
  message?: string;

  @ApiProperty({ type: () => PaginationMetaDto })
  meta: PaginationMetaDto;

  constructor(
    data: T[],
    total: number,
    page: number = PAGINATION_DEFAULTS.PAGE,
    limit: number = PAGINATION_DEFAULTS.LIMIT,
    message?: string
  ) {
    const totalPages = Math.ceil(total / limit) || 1;
    this.status = RESPONSE_STATUS.SUCCESS;
    this.data = data;
    if (message) {
      this.message = message;
    }
    this.meta = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}

/**
 * 3. Mutate Query Response DTO (With Data Payload)
 * Used for Create or Update actions that return the modified resource payload.
 */
export class MutateResponseDto<T = any> {
  @ApiProperty({ description: 'Response status indicator', example: RESPONSE_STATUS.SUCCESS })
  status: string;

  @ApiPropertyOptional({ description: 'Mutated resource object payload' })
  data?: T;

  @ApiPropertyOptional({
    description: 'Mutation status message',
  })
  message?: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(message?: string, data?: T) {
    this.status = RESPONSE_STATUS.SUCCESS;
    this.data = data;
    if (message) {
      this.message = message;
    }
    this.meta = {
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}

/**
 * 4. No-Data Mutate Response DTO
 * Used for mutation actions that do not return a data payload (e.g. DELETE, logout, mark as read).
 */
export class NoDataResponseDto {
  @ApiProperty({ description: 'Response status indicator', example: RESPONSE_STATUS.SUCCESS })
  status: string;

  @ApiPropertyOptional({
    description: 'Action status message',
  })
  message?: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(message?: string) {
    this.status = RESPONSE_STATUS.SUCCESS;
    if (message) {
      this.message = message;
    }
    this.meta = {
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}

/**
 * 5. Error Response DTO
 * Used for error responses formatted by HttpExceptionFilter.
 */
export class ErrorResponseDto {
  @ApiProperty({ description: 'Response status indicator', example: RESPONSE_STATUS.ERROR })
  status: string;

  @ApiProperty({
    description: 'Domain-specific error code for desktop app error handling',
    example: 'INVALID_CREDENTIALS',
  })
  code: string;

  @ApiProperty({
    description: 'Human-readable error description',
    example: 'Invalid email or password',
  })
  message: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(code: string, message: string) {
    this.status = RESPONSE_STATUS.ERROR;
    this.code = code;
    this.message = message;
    this.meta = {
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}
