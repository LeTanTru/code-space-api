import { applyDecorators, HttpStatus, Type } from '@nestjs/common';
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger';
import {
  SingleResponseDto,
  ListResponseDto,
  MutateResponseDto,
  NoDataResponseDto,
  ResponseMetaDto,
  PaginationMetaDto,
} from '@/common/dtos/api-response.dto';

const createOverrides = (description?: string, path?: string) => {
  const props: Record<string, any> = {};
  if (description) {
    props.message = { type: 'string', example: description };
  }
  if (path) {
    props.meta = {
      type: 'object',
      properties: {
        timestamp: { type: 'number', example: 1785500000000 },
        version: { type: 'string', example: 'v1' },
        path: { type: 'string', example: path },
      },
    };
  }
  return props;
};

/**
 * Swagger decorator for Single Query Response DTOs
 */
export const ApiSingleResponse = <TModel extends Type<any>>(
  model: TModel,
  status = HttpStatus.OK,
  description?: string,
  path?: string
) => {
  return applyDecorators(
    ApiExtraModels(SingleResponseDto, ResponseMetaDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SingleResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
              ...createOverrides(description, path),
            },
          },
        ],
      },
    })
  );
};

/**
 * Swagger decorator for List Query Response DTOs (Paginated)
 */
export const ApiListResponse = <TModel extends Type<any>>(
  model: TModel,
  status = HttpStatus.OK,
  description?: string,
  path?: string
) => {
  return applyDecorators(
    ApiExtraModels(ListResponseDto, PaginationMetaDto, model),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ListResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              ...createOverrides(description, path),
            },
          },
        ],
      },
    })
  );
};

/**
 * Swagger decorator for Mutate Query Response DTOs with Data Payload (Create, Update)
 */
export const ApiMutateResponse = <TModel extends Type<any>>(
  model?: TModel,
  status = HttpStatus.OK,
  description?: string,
  path?: string
) => {
  if (model) {
    return applyDecorators(
      ApiExtraModels(MutateResponseDto, ResponseMetaDto, model),
      ApiResponse({
        status,
        description,
        schema: {
          allOf: [
            { $ref: getSchemaPath(MutateResponseDto) },
            {
              properties: {
                data: { $ref: getSchemaPath(model) },
                ...createOverrides(description, path),
              },
            },
          ],
        },
      })
    );
  }

  return applyDecorators(
    ApiExtraModels(MutateResponseDto, ResponseMetaDto),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(MutateResponseDto) },
          {
            properties: createOverrides(description, path),
          },
        ],
      },
    })
  );
};

/**
 * Swagger decorator for No-Data Mutate Response DTOs (Delete, Logout, Actions returning no data)
 */
export const ApiNoDataResponse = (status = HttpStatus.OK, description?: string, path?: string) => {
  return applyDecorators(
    ApiExtraModels(NoDataResponseDto, ResponseMetaDto),
    ApiResponse({
      status,
      description,
      schema: {
        allOf: [
          { $ref: getSchemaPath(NoDataResponseDto) },
          {
            properties: createOverrides(description, path),
          },
        ],
      },
    })
  );
};
