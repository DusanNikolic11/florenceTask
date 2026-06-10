export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const parsePaginationParams = (
  rawPage: unknown,
  rawLimit: unknown
): { page: number; limit: number } => {
  const page = Math.max(1, parseInt(String(rawPage ?? DEFAULT_PAGE), 10) || DEFAULT_PAGE);
  const limit = Math.min(
    MAX_LIMIT,
    Math.max(1, parseInt(String(rawLimit ?? DEFAULT_LIMIT), 10) || DEFAULT_LIMIT)
  );
  return { page, limit };
};
