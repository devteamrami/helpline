/**
 * Task Models
 * TypeScript interfaces for task management
 */

/**
 * Task status type
 */
export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done' | 'Archived';

/**
 * Task priority type
 */
export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Critical';

/**
 * Task assignee interface
 */
export interface TaskAssignee {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Task interface - basic task information
 */
export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId?: string;
  createdBy: string;
  dueDate?: string;
  estimatedHours?: number;
  actualHours: number;
  createdAt: string;
  updatedAt: string;
  assignee?: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  creator?: {
    email: string;
    username: string;
    firstName?: string;
    lastName?: string;
  };
  assignees?: TaskAssignee[];  // NEW: Multiple assignees
}

/**
 * Task list request parameters
 */
export interface TaskListParams {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Task list response
 */
export interface TaskListResponse {
  tasks: Task[];
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
 * Create task request
 */
export interface CreateTaskRequest {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeIds?: string[];  // NEW: Multiple assignees
  dueDate?: string;
  estimatedHours?: number;
}

/**
 * Update task request
 */
export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  assigneeIds?: string[];  // NEW: Multiple assignees
  dueDate?: string;
  estimatedHours?: number;
}

/**
 * Assign task request
 */
export interface AssignTaskRequest {
  assigneeId: string | null;
}
