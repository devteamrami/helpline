/**
 * Activity Model
 * Represents a recent activity event from the backend.
 */

export type ActivityType =
  | 'ticket_created'
  | 'ticket_reply'
  | 'project_created'
  | 'project_updated'
  | 'project_archived'
  | 'task_created'
  | 'task_updated'
  | 'task_deleted'
  | 'task_commented'
  | 'task_started'
  | 'task_paused'
  | 'task_completed';

export interface Activity {
  id: string;
  type: ActivityType;
  resourceId: string | null;
  resourceType: 'project' | 'task' | 'ticket' | null;
  projectId: string | null;
  actorName: string;
  actorEmail: string;
  message: string;
  createdAt: string;
}

export interface ActivityPagination {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

export interface ActivityResponse {
  activities: Activity[];
  pagination: ActivityPagination;
}
