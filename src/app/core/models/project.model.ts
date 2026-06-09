/**
 * Project Models
 * TypeScript interfaces for project management
 */

/**
 * Project status type
 */
export type ProjectStatus = 'Active' | 'On Hold' | 'Completed' | 'Archived';

/**
 * Project interface - basic project information
 */
export interface Project {
  id: string;
  name: string;
  description: string;
  code: string;
  status: ProjectStatus;
  startDate?: string;
  endDate?: string;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Project detail interface - extended project information
 */
export interface ProjectDetail extends Project {
  settings: Record<string, any>;
  creator: {
    id: string;
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

/**
 * Project list request parameters
 */
export interface ProjectListParams {
  page?: number;
  limit?: number;
  status?: ProjectStatus;
  search?: string;
  startDateFrom?: string;
  startDateTo?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Project list response
 */
export interface ProjectListResponse {
  projects: Project[];
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
 * Create project request
 */
export interface CreateProjectRequest {
  name: string;
  description: string;
  code: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
}

/**
 * Update project request
 */
export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  startDate?: string;
  endDate?: string;
  settings?: Record<string, any>;
}

/**
 * Project role type
 */
export type ProjectRole = 'Project Admin' | 'Project Manager' | 'Project Member' | 'Project Viewer';

/**
 * Project member interface
 */
export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  projectRole: ProjectRole;
  joinedAt: string;
  isActive: boolean;
  user: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
    systemRole?: string;
  };
}

/**
 * Available user interface (for adding to project)
 */
export interface AvailableUser {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}

/**
 * Add project member request
 */
export interface AddProjectMemberRequest {
  userId: string;
  projectRole: ProjectRole;
}

/**
 * Update project member role request
 */
export interface UpdateProjectMemberRoleRequest {
  projectRole: ProjectRole;
}
