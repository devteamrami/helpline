/**
 * Project Service
 * Manages project-related API calls and state
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  Project,
  ProjectDetail,
  ProjectListParams,
  ProjectListResponse,
  CreateProjectRequest,
  UpdateProjectRequest
} from '../models/project.model';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

@Injectable({
  providedIn: 'root'
})
export class ProjectService {
  private http = inject(HttpClient);

  // State management
  private projectsSubject = new BehaviorSubject<Project[]>([]);
  public projects$ = this.projectsSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  private readonly apiUrl = `${environment.apiUrl}/projects`;

  /**
   * Get projects with pagination and filters
   */
  getProjects(params?: ProjectListParams): Observable<ProjectListResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const httpParams = this.buildParams(params);

    return this.http.get<ApiResponse<ProjectListResponse>>(this.apiUrl, { params: httpParams }).pipe(
      map(response => response.data!),
      tap(data => {
        this.projectsSubject.next(data.projects);
        this.loadingSubject.next(false);
      }),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Get project by ID
   */
  getProjectById(id: string): Observable<ProjectDetail> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.get<ApiResponse<{ project: ProjectDetail }>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data!.project),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Create new project
   */
  createProject(data: CreateProjectRequest): Observable<Project> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.post<ApiResponse<{ project: Project }>>(this.apiUrl, data).pipe(
      map(response => response.data!.project),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Update project
   */
  updateProject(id: string, data: UpdateProjectRequest): Observable<Project> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.put<ApiResponse<{ project: Project }>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data!.project),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Archive project (soft delete)
   */
  archiveProject(id: string): Observable<Project> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<ApiResponse<{ project: Project }>>(`${this.apiUrl}/${id}/archive`, {}).pipe(
      map(response => response.data!.project),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Unarchive project
   */
  unarchiveProject(id: string): Observable<Project> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http.patch<ApiResponse<{ project: Project }>>(`${this.apiUrl}/${id}/unarchive`, {}).pipe(
      map(response => response.data!.project),
      tap(() => this.loadingSubject.next(false)),
      catchError(error => {
        this.loadingSubject.next(false);
        const errorMessage = this.extractErrorMessage(error);
        this.errorSubject.next(errorMessage);
        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Build HTTP params from filter object
   */
  private buildParams(params?: ProjectListParams): HttpParams {
    let httpParams = new HttpParams();

    if (params) {
      if (params.page) httpParams = httpParams.set('page', params.page.toString());
      if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
      if (params.status) httpParams = httpParams.set('status', params.status);
      if (params.search) httpParams = httpParams.set('search', params.search);
      if (params.startDateFrom) httpParams = httpParams.set('startDateFrom', params.startDateFrom);
      if (params.startDateTo) httpParams = httpParams.set('startDateTo', params.startDateTo);
      if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
      if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
    }

    return httpParams;
  }

  /**
   * Extract error message from HTTP error response
   */
  private extractErrorMessage(error: any): string {
    if (error.error?.message) {
      return error.error.message;
    }
    if (error.error?.errors && error.error.errors.length > 0) {
      return error.error.errors.map((e: any) => e.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
