/**
 * User Service
 * Handles user management API calls
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  User,
  UserDetail,
  UserListParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  UserSearchResult,
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/users`;

  // State management
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  public error$ = this.errorSubject.asObservable();

  /**
   * Get users with pagination and filtering
   */
  getUsers(params?: UserListParams): Observable<UserListResponse> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    const httpParams = this.buildParams(params);

    return this.http
      .get<ApiResponse<UserListResponse>>(this.apiUrl, { params: httpParams })
      .pipe(
        map((response) => response.data!),
        tap((data) => {
          this.usersSubject.next(data.users);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Search users by query
   */
  searchUsers(query: string, limit?: number): Observable<User[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    let params = new HttpParams().set('q', query);
    if (limit) {
      params = params.set('limit', limit.toString());
    }

    return this.http
      .get<ApiResponse<{ users: User[] }>>(`${this.apiUrl}/search`, { params })
      .pipe(
        map((response) => response.data!.users),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Get user details by ID
   */
  getUserById(id: string): Observable<UserDetail> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .get<ApiResponse<{ user: UserDetail }>>(`${this.apiUrl}/${id}`)
      .pipe(
        map((response) => response.data!.user),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Get users available for a project (not already members)
   */
  getAvailableUsers(projectId: string): Observable<User[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .get<ApiResponse<{ users: User[] }>>(
        `${this.apiUrl}/available/${projectId}`
      )
      .pipe(
        map((response) => response.data!.users),
        tap(() => this.loadingSubject.next(false)),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Create new user
   */
  createUser(userData: CreateUserRequest): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .post<ApiResponse<{ user: User }>>(this.apiUrl, userData)
      .pipe(
        map((response) => response.data!.user),
        tap((user) => {
          // Add new user to the list
          const currentUsers = this.usersSubject.value;
          this.usersSubject.next([user, ...currentUsers]);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Update user information
   */
  updateUser(id: string, userData: UpdateUserRequest): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .put<ApiResponse<{ user: User }>>(`${this.apiUrl}/${id}`, userData)
      .pipe(
        map((response) => response.data!.user),
        tap((updatedUser) => {
          // Update user in the list
          const currentUsers = this.usersSubject.value;
          const updatedUsers = currentUsers.map((user) =>
            user.id === id ? { ...user, ...updatedUser } : user
          );
          this.usersSubject.next(updatedUsers);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Deactivate user account
   */
  deactivateUser(id: string): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiUrl}/${id}/deactivate`, {})
      .pipe(
        map((response) => response.data!.user),
        tap((deactivatedUser) => {
          // Update user in the list
          const currentUsers = this.usersSubject.value;
          const updatedUsers = currentUsers.map((user) =>
            user.id === id ? { ...user, isActive: false } : user
          );
          this.usersSubject.next(updatedUsers);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Activate user account
   */
  activateUser(id: string): Observable<User> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    return this.http
      .patch<ApiResponse<{ user: User }>>(`${this.apiUrl}/${id}/activate`, {})
      .pipe(
        map((response) => response.data!.user),
        tap((activatedUser) => {
          // Update user in the list
          const currentUsers = this.usersSubject.value;
          const updatedUsers = currentUsers.map((user) =>
            user.id === id ? { ...user, isActive: true } : user
          );
          this.usersSubject.next(updatedUsers);
          this.loadingSubject.next(false);
        }),
        catchError((error) => {
          this.loadingSubject.next(false);
          const errorMessage = this.extractErrorMessage(error);
          this.errorSubject.next(errorMessage);
          return throwError(() => new Error(errorMessage));
        })
      );
  }

  /**
   * Build HTTP params from UserListParams
   */
  private buildParams(params?: UserListParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) {
      return httpParams;
    }

    if (params.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    if (params.limit) {
      httpParams = httpParams.set('limit', params.limit.toString());
    }
    if (params.role) {
      httpParams = httpParams.set('role', params.role);
    }
    if (params.isActive !== undefined) {
      httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    if (params.isVerified !== undefined) {
      httpParams = httpParams.set('isVerified', params.isVerified.toString());
    }
    if (params.search) {
      httpParams = httpParams.set('search', params.search);
    }
    if (params.sortBy) {
      httpParams = httpParams.set('sortBy', params.sortBy);
    }
    if (params.sortOrder) {
      httpParams = httpParams.set('sortOrder', params.sortOrder);
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
    if (error.error?.errors && Array.isArray(error.error.errors)) {
      return error.error.errors.map((e: any) => e.message).join(', ');
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  }
}
