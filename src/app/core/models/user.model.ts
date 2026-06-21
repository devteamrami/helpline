/**
 * User Model and Interfaces
 */

export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  departmentId?: string;
  isActive?: boolean;
  isVerified?: boolean;
  lastLogin?: string;
  createdAt?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
}

/**
 * User Management Interfaces
 */

/**
 * User detail interface - extended user information
 */
export interface UserDetail extends User {
  updatedAt?: string;
  roleDescription?: string;
  projectMemberships?: ProjectMembership[];
}

/**
 * Project membership interface
 */
export interface ProjectMembership {
  projectId: string;
  projectName: string;
  projectRole: string;
  joinedAt: string;
}

/**
 * User list request parameters
 */
export interface UserListParams {
  page?: number;
  limit?: number;
  role?: string;
  isActive?: boolean;
  isVerified?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * User list response
 */
export interface UserListResponse {
  users: User[];
  pagination: PaginationMeta;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

/**
 * Create user request
 */
export interface CreateUserRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
  departmentId: string;
}

/**
 * Update user request
 */
export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  departmentId?: string;
  isActive?: boolean;
}

/**
 * User search result
 */
export interface UserSearchResult {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  isActive: boolean;
}
