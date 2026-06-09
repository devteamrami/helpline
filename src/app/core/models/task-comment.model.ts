/**
 * Task Comment Models
 * TypeScript interfaces for task comments and activity
 */

export type CommentType = 
  | 'general' 
  | 'work_update' 
  | 'blocker' 
  | 'pause_reason' 
  | 'testing' 
  | 'manual_hours';

export interface TaskComment {
  id: string;
  taskId: string;
  userId: string;
  comment: string;
  commentType: CommentType;
  createdAt: string;
  updatedAt: string;
  user: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface AddCommentRequest {
  comment: string;
  commentType?: CommentType;
}

export interface UpdateCommentRequest {
  comment: string;
}

export interface CommentsResponse {
  comments: TaskComment[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface CommentTypeInfo {
  value: CommentType;
  label: string;
  icon: string;
  color: string;
}

export const COMMENT_TYPES: CommentTypeInfo[] = [
  { value: 'general', label: 'General', icon: 'chat', color: '#6c757d' },
  { value: 'work_update', label: 'Work Update', icon: 'update', color: '#0d6efd' },
  { value: 'blocker', label: 'Blocker', icon: 'block', color: '#dc3545' },
  { value: 'pause_reason', label: 'Pause Reason', icon: 'pause_circle', color: '#ffc107' },
  { value: 'testing', label: 'Testing', icon: 'bug_report', color: '#20c997' },
  { value: 'manual_hours', label: 'Manual Hours', icon: 'schedule', color: '#6f42c1' }
];
