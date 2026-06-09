/**
 * Authentication Service
 * Handles all authentication-related operations
 */

import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';
import {
  User,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RefreshTokenRequest,
  RefreshTokenResponse,
} from '../models/user.model';
import { ApiResponse } from '../models/api-response.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);
  private storage = inject(StorageService);
  private router = inject(Router);

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private tokenRefreshInProgress = false;

  constructor() {
    this.loadUserFromStorage();
  }

  /**
   * Get current user value
   */
  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get authentication status
   */
  get isAuthenticated(): boolean {
    return this.isAuthenticatedSubject.value;
  }

  /**
   * Load user from storage on app initialization
   */
  private loadUserFromStorage(): void {
    const token = this.storage.getItem<string>(environment.tokenKey);
    const user = this.storage.getItem<User>(environment.userKey);

    console.log('📦 Loading auth from storage:', {
      hasToken: !!token,
      hasUser: !!user,
      tokenKey: environment.tokenKey,
      userKey: environment.userKey
    });

    if (token && user) {
      console.log('✅ Auth loaded from storage:', user.username);
      this.currentUserSubject.next(user);
      this.isAuthenticatedSubject.next(true);
    } else {
      console.log('❌ No auth data in storage');
    }
  }

  /**
   * Login user
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<ApiResponse<LoginResponse>>(
        `${environment.apiUrl}/auth/login`,
        credentials
      )
      .pipe(
        map((response) => response.data!),
        tap((data) => {
          this.setSession(data);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   */
  register(userData: RegisterRequest): Observable<User> {
    return this.http
      .post<ApiResponse<{ user: User }>>(
        `${environment.apiUrl}/auth/register`,
        userData
      )
      .pipe(
        map((response) => response.data!.user),
        catchError(this.handleError)
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    const refreshToken = this.storage.getItem<string>(
      environment.refreshTokenKey
    );

    return this.http
      .post<ApiResponse>(`${environment.apiUrl}/auth/logout`, {
        refreshToken,
      })
      .pipe(
        tap(() => {
          this.clearSession();
        }),
        catchError((error) => {
          // Clear session even if logout request fails
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  /**
   * Refresh access token
   */
  refreshToken(): Observable<string> {
    // Prevent multiple simultaneous refresh requests
    if (this.tokenRefreshInProgress) {
      return throwError(() => new Error('Token refresh already in progress'));
    }

    const refreshToken = this.storage.getItem<string>(
      environment.refreshTokenKey
    );

    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    this.tokenRefreshInProgress = true;
    const request: RefreshTokenRequest = { refreshToken };

    return this.http
      .post<ApiResponse<RefreshTokenResponse>>(
        `${environment.apiUrl}/auth/refresh`,
        request
      )
      .pipe(
        map((response) => response.data!.accessToken),
        tap((accessToken) => {
          this.storage.setItem(environment.tokenKey, accessToken);
          this.tokenRefreshInProgress = false;
          console.log('✅ Access token refreshed successfully');
        }),
        catchError((error) => {
          this.tokenRefreshInProgress = false;
          console.error('❌ Token refresh failed:', error);
          this.clearSession();
          return throwError(() => error);
        })
      );
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.http
      .get<ApiResponse<{ profile: User }>>(
        `${environment.apiUrl}/auth/profile`
      )
      .pipe(
        map((response) => response.data!.profile),
        tap((user) => {
          this.currentUserSubject.next(user);
          this.storage.setItem(environment.userKey, user);
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Verify token validity
   */
  verifyToken(): Observable<boolean> {
    return this.http
      .get<ApiResponse>(`${environment.apiUrl}/auth/verify`)
      .pipe(
        map(() => true),
        catchError(() => {
          this.clearSession();
          return throwError(() => new Error('Token verification failed'));
        })
      );
  }

  /**
   * Get access token
   */
  getAccessToken(): string | null {
    return this.storage.getItem<string>(environment.tokenKey);
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return this.storage.getItem<string>(environment.refreshTokenKey);
  }

  /**
   * Set authentication session
   */
  private setSession(authResult: LoginResponse): void {
    this.storage.setItem(environment.tokenKey, authResult.accessToken);
    this.storage.setItem(environment.refreshTokenKey, authResult.refreshToken);
    this.storage.setItem(environment.userKey, authResult.user);

    this.currentUserSubject.next(authResult.user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Clear authentication session
   */
  private clearSession(): void {
    this.storage.removeItem(environment.tokenKey);
    this.storage.removeItem(environment.refreshTokenKey);
    this.storage.removeItem(environment.userKey);

    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    this.router.navigate(['/auth/login']);
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';

    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.status === 0) {
      errorMessage = 'Cannot connect to server. Please check if the backend is running.';
    } else if (error.status === 401) {
      errorMessage = 'Invalid email or password';
    } else if (error.status === 500) {
      errorMessage = 'Server error. Please try again later.';
    }

    console.error('Auth Service Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}
