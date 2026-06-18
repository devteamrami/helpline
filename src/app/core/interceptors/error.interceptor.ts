/**
 * Error Interceptor
 * Handles HTTP errors globally and manages token refresh
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, timeout } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // If this is a refresh request itself failing, just propagate
        if (req.url.includes('/auth/refresh')) {
          return throwError(() => error);
        }

        // Check if we even have a refresh token before attempting
        const hasRefreshToken = authService.getRefreshToken();
        if (!hasRefreshToken) {
          // No refresh token, redirect to login immediately
          authService.logout().subscribe();
          router.navigate(['/auth/login']);
          return throwError(() => error);
        }

        // Try to refresh the token with timeout
        return authService.refreshToken().pipe(
          timeout(10000),
          switchMap((newToken) => {
            const clonedReq = req.clone({
              setHeaders: { Authorization: `Bearer ${newToken}` },
            });
            return next(clonedReq);
          }),
          catchError((refreshError) => {
            // Refresh failed or timed out, logout and redirect
            authService.logout().subscribe();
            router.navigate(['/auth/login']);
            return throwError(() => refreshError);
          })
        );
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        console.error('Access forbidden:', error.error?.message);
      }

      // Handle 500 Server errors
      if (error.status >= 500) {
        console.error('Server error:', error.error?.message);
      }

      return throwError(() => error);
    })
  );
};
