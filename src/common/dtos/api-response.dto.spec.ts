import {
  SingleResponseDto,
  ListResponseDto,
  MutateResponseDto,
  NoDataResponseDto,
  ErrorResponseDto,
} from '@/common/dtos/api-response.dto';

describe('API Response DTOs', () => {
  describe('SingleResponseDto', () => {
    it('should correctly format single item response without code field', () => {
      const data = { id: 1, name: 'Cyberpunk Theme' };
      const response = new SingleResponseDto(data, 'Theme retrieved');

      expect(response.status).toBe('success');
      expect((response as any).code).toBeUndefined();
      expect(response.data).toEqual(data);
      expect(response.message).toBe('Theme retrieved');
      expect(response.meta.version).toBe('v1');
      expect(typeof response.meta.timestamp).toBe('number');
    });
  });

  describe('ListResponseDto', () => {
    it('should correctly format list items with pagination metadata without code field', () => {
      const items = [{ id: 1 }, { id: 2 }];
      const response = new ListResponseDto(items, 50, 1, 10, 'List fetched');

      expect(response.status).toBe('success');
      expect((response as any).code).toBeUndefined();
      expect(response.data).toHaveLength(2);
      expect(response.meta.total).toBe(50);
      expect(response.meta.page).toBe(1);
      expect(response.meta.limit).toBe(10);
      expect(response.meta.totalPages).toBe(5);
      expect(response.meta.hasNextPage).toBe(true);
      expect(response.meta.hasPreviousPage).toBe(false);
    });
  });

  describe('MutateResponseDto', () => {
    it('should correctly format mutation response with data payload without code field', () => {
      const data = { id: 'preset-123', name: 'Web Dev' };
      const response = new MutateResponseDto('Preset created successfully', data);

      expect(response.status).toBe('success');
      expect((response as any).code).toBeUndefined();
      expect(response.message).toBe('Preset created successfully');
      expect(response.data).toEqual(data);
      expect(response.meta.version).toBe('v1');
    });
  });

  describe('NoDataResponseDto', () => {
    it('should correctly format no-data mutation response without code field', () => {
      const response = new NoDataResponseDto('Item deleted successfully');

      expect(response.status).toBe('success');
      expect((response as any).code).toBeUndefined();
      expect(response.message).toBe('Item deleted successfully');
      expect((response as any).data).toBeUndefined();
      expect(response.meta.version).toBe('v1');
      expect(typeof response.meta.timestamp).toBe('number');
    });
  });

  describe('ErrorResponseDto', () => {
    it('should correctly format error response WITH domain-specific code field and no data property', () => {
      const response = new ErrorResponseDto('TOO_MANY_REQUESTS', 'Too many requests');

      expect(response.status).toBe('error');
      expect(response.code).toBe('TOO_MANY_REQUESTS');
      expect(response.message).toBe('Too many requests');
      expect((response as any).data).toBeUndefined();
      expect((response as any).error).toBeUndefined();
      expect(response.meta.version).toBe('v1');
    });
  });
});
