/**
 * Task History Service
 * Handles task audit history and activity tracking
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  TaskHistory,
  HistoryResponse,
  HistoryAction
} from '../models/task-history.model';

@Injectable({
  providedIn: 'root'
})
export class TaskHistoryService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  // State management
  private historySubject = new BehaviorSubject<TaskHistory[]>([]);
  public history$ = this.historySubject.asObservable();

  private paginationSubject = new BehaviorSubject<{
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
  } | null>(null);
  public pagination$ = this.paginationSubject.asObservable();

  /**
   * Get history for a task
   */
  getHistory(
    projectId: string,
    taskId: string,
    page: number = 1,
    limit: number = 50,
    action?: HistoryAction
  ): Observable<HistoryResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    if (action) {
      params = params.set('action', action);
    }

    return this.http
      .get<{ success: boolean; data: HistoryResponse; message: string }>(
        `${this.apiUrl}/${projectId}/tasks/${taskId}/history`,
        { params }
      )
      .pipe(
        tap(response => {
          if (response.success && response.data) {
            this.historySubject.next(response.data.history);
            this.paginationSubject.next(response.data.pagination);
          }
        }),
        map(response => response.data)
      );
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.historySubject.next([]);
    this.paginationSubject.next(null);
  }

  /**
   * Get current history
   */
  getHistoryValue(): TaskHistory[] {
    return this.historySubject.value;
  }

  /**
   * Format history entry for display
   */
  formatHistoryEntry(entry: TaskHistory): string {
    const userName = `${entry.user.firstName} ${entry.user.lastName}`.trim() || entry.user.username;

    switch (entry.action) {
      case 'created':
        return `${userName} created this task`;
      case 'updated':
        if (entry.fieldName && entry.oldValue && entry.newValue) {
          return `${userName} changed ${entry.fieldName} from "${entry.oldValue}" to "${entry.newValue}"`;
        }
        return `${userName} updated this task`;
      case 'status_changed':
        return `${userName} changed status from "${entry.oldValue}" to "${entry.newValue}"`;
      case 'assigned':
        return `${userName} assigned this task`;
      case 'unassigned':
        return `${userName} unassigned this task`;
      case 'started':
        return `${userName} started working on this task`;
      case 'paused':
        return `${userName} paused work (${entry.newValue})`;
      case 'completed':
        return `${userName} completed this task`;
      case 'comment_added':
        return `${userName} added a ${entry.newValue} comment`;
      case 'time_logged':
        return `${userName} logged ${entry.newValue}`;
      default:
        return `${userName} performed ${entry.action}`;
    }
  }
}
