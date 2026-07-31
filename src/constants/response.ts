export const RESPONSE_STATUS = {
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

export const RESPONSE_MESSAGES = {
  SINGLE_FETCH_SUCCESS: 'Resource retrieved successfully',
  LIST_FETCH_SUCCESS: 'Resources retrieved successfully',
  MUTATION_SUCCESS: 'Operation completed successfully',
} as const;

export const API_META_DEFAULTS = {
  VERSION: 'v1',
} as const;
