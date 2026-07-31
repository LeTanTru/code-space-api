import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PAGINATION_DEFAULTS } from '@/constants/pagination';

export class PaginationQueryDto {
  @ApiPropertyOptional({
    description: 'Page number (minimum 1)',
    default: PAGINATION_DEFAULTS.PAGE,
    example: PAGINATION_DEFAULTS.PAGE,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_DEFAULTS.MIN_PAGE)
  page?: number = PAGINATION_DEFAULTS.PAGE;

  @ApiPropertyOptional({
    description: `Items per page (${PAGINATION_DEFAULTS.MIN_LIMIT}-${PAGINATION_DEFAULTS.MAX_LIMIT})`,
    default: PAGINATION_DEFAULTS.LIMIT,
    example: PAGINATION_DEFAULTS.LIMIT,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(PAGINATION_DEFAULTS.MIN_LIMIT)
  @Max(PAGINATION_DEFAULTS.MAX_LIMIT)
  limit?: number = PAGINATION_DEFAULTS.LIMIT;

  @ApiPropertyOptional({ description: 'Search term filter', example: 'cyberpunk' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Field name to sort by', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Sort direction: asc or desc',
    enum: ['asc', 'desc'],
    default: PAGINATION_DEFAULTS.SORT_ORDER,
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = PAGINATION_DEFAULTS.SORT_ORDER;

  get skip(): number {
    return (
      ((this.page || PAGINATION_DEFAULTS.PAGE) - 1) * (this.limit || PAGINATION_DEFAULTS.LIMIT)
    );
  }

  get take(): number {
    return this.limit || PAGINATION_DEFAULTS.LIMIT;
  }
}
