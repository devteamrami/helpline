/**
 * Task Time Tracking Service
 * Handles time tracking operations (Start/Pause/Complete)
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TimeLog,
  ActiveWorker,
  PauseTaskRequest,
  CompleteTaskRequest,
  TimeTrackingResponse
} from '../models/task-time-log.model';

@Injectable({
  providedIn: 'root'
})
export class TaskTimeTrackingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  // State management
  private activeTimeLogSubject = new BehaviorSubject<TimeLog | null>(null);
  public activeTimeLog$ = this.activeTimeLogSubject.asObservable();

  private timeLogsSubject = new BehaviorSubject<TimeLog[]>([]);
  public timeLogs$ = this.timeLogsSubject.asObservable();

  private activeWorkersSubject = new BehaviorSubject<ActiveWorker[]>([]);
  public activeWorkers$ = this.activeWorkersSubject.asObservable();

  /**
   * Start working on a task
   * @param force - If true, allows starting even if user has another active task
   */
  startTask(projectId: string, taskId: string, force: boolean = false): Observable<{ timeLog: TimeLog }> {
    const body = force ? { force: true } : {};
    
    return this.http
      .post<{ success: boolean; data: { timeLog: TimeLog }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/start`,
        body
      )
      .pipe(
        tap(response => {
          if (response.success && response.data.timeLog) {
            this.activeTimeLogSubject.next(response.data.timeLog);
            // Refresh time logs
            this.getTimeLogs(projectId, taskId).subscribe();
            this.getActiveWorkers(projectId, taskId).subscribe();
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Pause working on a task
   */
  pauseTask(
    projectId: string,
    taskId: string,
    pauseReason?: string
  ): Observable<{ timeLog: TimeLog }> {
    const body: PauseTaskRequest = pauseReason ? { pauseReason } : {};

    return this.http
      .post<{ success: boolean; data: { timeLog: TimeLog }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/pause`,
        body
      )
      .pipe(
        tap(response => {
          if (response.success) {
            // Refresh active workers — widget derives its state from this
            this.getTimeLogs(projectId, taskId).subscribe();
            this.getActiveWorkers(projectId, taskId).subscribe();
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Complete a task
   */
  completeTask(
    projectId: string,
    taskId: string,
    completionNotes?: string
  ): Observable<TimeTrackingResponse> {
    const body: CompleteTaskRequest = completionNotes ? { completionNotes } : {};

    return this.http
      .post<{ success: boolean; data: TimeTrackingResponse; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/complete`,
        body
      )
      .pipe(
        tap(response => {
          if (response.success) {
            // Refresh active workers — widget derives its state from this
            this.getTimeLogs(projectId, taskId).subscribe();
            this.getActiveWorkers(projectId, taskId).subscribe();
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Get time logs for a task
   */
  getTimeLogs(projectId: string, taskId: string): Observable<TimeLog[]> {
    return this.http
      .get<{ success: boolean; data: { timeLogs: TimeLog[] }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/time-logs`
      )
      .pipe(
        tap(response => {
          if (response.success && response.data.timeLogs) {
            this.timeLogsSubject.next(response.data.timeLogs);
          }
        }),
        map(response => response.data.timeLogs)
      );
  }

  /**
   * Get active workers for a task
   */
  getActiveWorkers(projectId: string, taskId: string): Observable<ActiveWorker[]> {
    return this.http
      .get<{ success: boolean; data: { activeWorkers: ActiveWorker[] }; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/active-workers`
      )
      .pipe(
        tap(response => {
          if (response.success && response.data.activeWorkers) {
            this.activeWorkersSubject.next(response.data.activeWorkers);
          }
        }),
        map(response => response.data.activeWorkers)
      );
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.activeTimeLogSubject.next(null);
    this.timeLogsSubject.next([]);
    this.activeWorkersSubject.next([]);
  }

  /**
   * Get current active time log
   */
  getActiveTimeLog(): TimeLog | null {
    return this.activeTimeLogSubject.value;
  }

  /**
   * Calculate elapsed time in minutes
   */
  calculateElapsedMinutes(startTime: string): number {
    const start = new Date(startTime);
    const now = new Date();
    return Math.floor((now.getTime() - start.getTime()) / 1000 / 60);
  }

  /**
   * Format duration in minutes to human readable format
   */
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
}
