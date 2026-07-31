import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PAGINATION_DEFAULTS } from '@/constants/pagination';
import { RESPONSE_STATUS, RESPONSE_MESSAGES, API_META_DEFAULTS } from '@/constants/response';

export class ResponseMetaDto {
  @ApiProperty({ description: 'Response timestamp in milliseconds', example: 1785500000000 })
  timestamp: number;

  @ApiProperty({ description: 'API version identifier', example: API_META_DEFAULTS.VERSION })
  version: string;
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
    description: 'Optional human-readable response message',
    example: RESPONSE_MESSAGES.SINGLE_FETCH_SUCCESS,
  })
  message?: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(data: T, message?: string) {
    this.status = RESPONSE_STATUS.SUCCESS;
    this.data = data;
    this.message = message || RESPONSE_MESSAGES.SINGLE_FETCH_SUCCESS;
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
    description: 'Optional human-readable response message',
    example: RESPONSE_MESSAGES.LIST_FETCH_SUCCESS,
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
    this.message = message || RESPONSE_MESSAGES.LIST_FETCH_SUCCESS;
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

  @ApiProperty({
    description: 'Mutation status message',
    example: RESPONSE_MESSAGES.MUTATION_SUCCESS,
  })
  message: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(message: string = RESPONSE_MESSAGES.MUTATION_SUCCESS, data?: T) {
    this.status = RESPONSE_STATUS.SUCCESS;
    this.data = data;
    this.message = message;
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

  @ApiProperty({
    description: 'Action status message',
    example: RESPONSE_MESSAGES.MUTATION_SUCCESS,
  })
  message: string;

  @ApiProperty({ type: () => ResponseMetaDto })
  meta: ResponseMetaDto;

  constructor(message: string = RESPONSE_MESSAGES.MUTATION_SUCCESS) {
    this.status = RESPONSE_STATUS.SUCCESS;
    this.message = message;
    this.meta = {
      timestamp: Date.now(),
      version: API_META_DEFAULTS.VERSION,
    };
  }
}
