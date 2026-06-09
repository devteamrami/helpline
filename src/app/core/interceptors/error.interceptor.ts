/**
 * Error Interceptor
 * Handles HTTP errors globally and manages token refresh
 */

import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401) {
        // Check if this is not a refresh token request
        if (!req.url.includes('/auth/refresh')) {
          // Try to refresh the token
          return authService.refreshToken().pipe(
            switchMap((newToken) => {
              // Retry the original request with new token
              const clonedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newToken}`,
                },
              });
              return next(clonedReq);
            }),
            catchError((refreshError) => {
              // Refresh failed, logout user
              authService.logout().subscribe();
              router.navigate(['/auth/login']);
              return throwError(() => refreshError);
            })
          );
        }
      }

      // Handle 403 Forbidden errors
      if (error.status === 403) {
        console.error('Access forbidden:', error.error?.message);
      }

      // Handle 404 Not Found errors
      if (error.status === 404) {
        console.error('Resource not found:', error.error?.message);
      }

      // Handle 500 Server errors
      if (error.status >= 500) {
        console.error('Server error:', error.error?.message);
      }

      return throwError(() => error);
    })
  );
};
