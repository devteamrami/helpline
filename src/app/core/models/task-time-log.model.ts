/**
 * Task Time Log Models
 * TypeScript interfaces for time tracking
 */

export interface TimeLog {
  id: string;
  taskId: string;
  userId: string;
  startTime: string; // ISO 8601 UTC timestamp
  endTime: string | null; // ISO 8601 UTC timestamp
  durationMinutes: number | null;
  isActive: boolean;
  createdAt: string;
  user: {
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface ActiveWorker {
  timeLogId: string;
  startTime: string; // ISO 8601 UTC timestamp
  user: {
    id: string;
    email: string;
    username: string;
    firstName: string;
    lastName: string;
  };
}

export interface StartTaskRequest {
  // No body needed - taskId and userId from route and auth
}

export interface PauseTaskRequest {
  pauseReason?: string;
}

export interface CompleteTaskRequest {
  completionNotes?: string;
}

export interface TimeTrackingResponse {
  taskId: string;
  status: string;
  actualHours: number;
}
