/**
 * Task Service
 * Handles task management operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { environment } from '../../../environments/environment';
import {
  Task,
  TaskListParams,
  TaskListResponse,
  CreateTaskRequest,
  UpdateTaskRequest,
  AssignTaskRequest
} from '../models/task.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class TaskService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/projects`;

  // State management
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  public tasks$ = this.tasksSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Get current tasks value
   */
  get tasksValue(): Task[] {
    return this.tasksSubject.value;
  }

  /**
   * Get tasks for a project
   */
  getTasks(projectId: string, params?: TaskListParams): Observable<TaskListResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    // Build query parameters
    let queryParams = '';
    if (params) {
      const queryArray: string[] = [];
      if (params.status) queryArray.push(`status=${encodeURIComponent(params.status)}`);
      if (params.priority) queryArray.push(`priority=${encodeURIComponent(params.priority)}`);
      if (params.assigneeId) queryArray.push(`assigneeId=${params.assigneeId}`);
      if (params.search) queryArray.push(`search=${encodeURIComponent(params.search)}`);
      if (params.page) queryArray.push(`page=${params.page}`);
      if (params.limit) queryArray.push(`limit=${params.limit}`);
      if (params.sortBy) queryArray.push(`sortBy=${params.sortBy}`);
      if (params.sortOrder) queryArray.push(`sortOrder=${params.sortOrder}`);
      
      if (queryArray.length > 0) {
        queryParams = '?' + queryArray.join('&');
      }
    }

    return this.http.get<ApiResponse<TaskListResponse>>(
      `${this.apiUrl}/${projectId}/tasks${queryParams}`
    ).pipe(
      map(response => response.data),
      tap(data => {
        this.tasksSubject.next(data.tasks);
        this.loadingSubject.next(false);
      })
    );
  }

  /**
   * Get task by ID
   */
  getTaskById(projectId: string, taskId: string): Observable<Task> {
    return this.http.get<ApiResponse<{ task: Task }>>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}`
    ).pipe(
      map(response => response.data.task)
    );
  }

  /**
   * Create new task
   */
  createTask(projectId: string, request: CreateTaskRequest): Observable<Task> {
    return this.http.post<ApiResponse<{ task: Task }>>(
      `${this.apiUrl}/${projectId}/tasks`,
      request
    ).pipe(
      map(response => response.data.task),
      tap(task => {
        const currentTasks = this.tasksValue;
        this.tasksSubject.next([task, ...currentTasks]);
      })
    );
  }

  /**
   * Update task
   */
  updateTask(projectId: string, taskId: string, request: UpdateTaskRequest): Observable<Task> {
    return this.http.put<ApiResponse<{ task: Task }>>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}`,
      request
    ).pipe(
      map(response => response.data.task),
      tap(updatedTask => {
        const currentTasks = this.tasksValue;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          currentTasks[index] = updatedTask;
          this.tasksSubject.next([...currentTasks]);
        }
      })
    );
  }

  /**
   * Assign task to user
   */
  assignTask(projectId: string, taskId: string, request: AssignTaskRequest): Observable<Task> {
    return this.http.patch<ApiResponse<{ task: Task }>>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}/assign`,
      request
    ).pipe(
      map(response => response.data.task),
      tap(updatedTask => {
        const currentTasks = this.tasksValue;
        const index = currentTasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          currentTasks[index] = updatedTask;
          this.tasksSubject.next([...currentTasks]);
        }
      })
    );
  }

  /**
   * Delete task
   */
  deleteTask(projectId: string, taskId: string): Observable<void> {
    return this.http.delete<ApiResponse<null>>(
      `${this.apiUrl}/${projectId}/tasks/${taskId}`
    ).pipe(
      map(() => void 0),
      tap(() => {
        const currentTasks = this.tasksValue;
        const filteredTasks = currentTasks.filter(t => t.id !== taskId);
        this.tasksSubject.next(filteredTasks);
      })
    );
  }

  /**
   * Clear tasks state
   */
  clearTasks(): void {
    this.tasksSubject.next([]);
  }

  /**
   * Set loading state
   */
  setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  /**
   * Set error state
   */
  setError(error: string | null): void {
    this.errorSubject.next(error);
  }
}
