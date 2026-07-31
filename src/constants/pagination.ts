export const PAGINATION_DEFAULTS = {
  PAGE: 1,
  LIMIT: 20,
  MIN_PAGE: 1,
  MIN_LIMIT: 1,
  MAX_LIMIT: 100,
  SORT_ORDER: 'desc' as const,
} as const;
