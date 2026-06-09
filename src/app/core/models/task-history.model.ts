/**
 * Task History Models
 * TypeScript interfaces for task audit history
 */

export type HistoryAction = 
  | 'created' 
  | 'updated' 
  | 'status_changed' 
  | 'assigned' 
  | 'unassigned'
  | 'started' 
  | 'paused' 
  | 'completed' 
  | 'comment_added' 
  | 'time_logged';

export interface TaskHistory {
  id: string;
  taskId: string;
  userId: string;
  action: HistoryAction;
  fieldName: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: string;
  user: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface HistoryResponse {
  history: TaskHistory[];
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  };
}

export interface HistoryActionInfo {
  value: HistoryAction;
  label: string;
  icon: string;
  color: string;
}

export const HISTORY_ACTIONS: HistoryActionInfo[] = [
  { value: 'created', label: 'Created', icon: 'add_circle', color: '#28a745' },
  { value: 'updated', label: 'Updated', icon: 'edit', color: '#0d6efd' },
  { value: 'status_changed', label: 'Status Changed', icon: 'swap_horiz', color: '#17a2b8' },
  { value: 'assigned', label: 'Assigned', icon: 'person_add', color: '#6f42c1' },
  { value: 'unassigned', label: 'Unassigned', icon: 'person_remove', color: '#6c757d' },
  { value: 'started', label: 'Started', icon: 'play_arrow', color: '#28a745' },
  { value: 'paused', label: 'Paused', icon: 'pause', color: '#ffc107' },
  { value: 'completed', label: 'Completed', icon: 'check_circle', color: '#28a745' },
  { value: 'comment_added', label: 'Comment Added', icon: 'comment', color: '#0d6efd' },
  { value: 'time_logged', label: 'Time Logged', icon: 'schedule', color: '#6f42c1' }
];
