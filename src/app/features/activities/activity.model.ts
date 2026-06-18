/**
 * Activity Model
 * Represents a recent activity event from the backend.
 */

export interface Activity {
  id: string;
  type: 'ticket_created' | 'ticket_reply';
  ticketId: string;
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
