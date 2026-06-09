/**
 * API Response Models
 */

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ApiError[];
  timestamp: string;
}

export interface ApiError {
  field?: string;
  message: string;
}
