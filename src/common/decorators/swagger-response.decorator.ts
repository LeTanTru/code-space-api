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

/**
 * Swagger decorator for Single Query Response DTOs
 */
export const ApiSingleResponse = <TModel extends Type<any>>(
  model: TModel,
  status = HttpStatus.OK
) => {
  return applyDecorators(
    ApiExtraModels(SingleResponseDto, ResponseMetaDto, model),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(SingleResponseDto) },
          {
            properties: {
              data: { $ref: getSchemaPath(model) },
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
  status = HttpStatus.OK
) => {
  return applyDecorators(
    ApiExtraModels(ListResponseDto, PaginationMetaDto, model),
    ApiResponse({
      status,
      schema: {
        allOf: [
          { $ref: getSchemaPath(ListResponseDto) },
          {
            properties: {
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
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
  status = HttpStatus.OK
) => {
  if (model) {
    return applyDecorators(
      ApiExtraModels(MutateResponseDto, ResponseMetaDto, model),
      ApiResponse({
        status,
        schema: {
          allOf: [
            { $ref: getSchemaPath(MutateResponseDto) },
            {
              properties: {
                data: { $ref: getSchemaPath(model) },
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
      schema: {
        $ref: getSchemaPath(MutateResponseDto),
      },
    })
  );
};

/**
 * Swagger decorator for No-Data Mutate Response DTOs (Delete, Logout, Actions returning no data)
 */
export const ApiNoDataResponse = (status = HttpStatus.OK) => {
  return applyDecorators(
    ApiExtraModels(NoDataResponseDto, ResponseMetaDto),
    ApiResponse({
      status,
      schema: {
        $ref: getSchemaPath(NoDataResponseDto),
      },
    })
  );
};
