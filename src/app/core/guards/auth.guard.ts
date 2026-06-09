/**
 * Authentication Guard
 * Protects routes that require authentication
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated;
  const user = authService.currentUserValue;
  
  console.log('🛡️ Auth Guard Check:', {
    isAuthenticated: isAuth,
    hasUser: !!user,
    requestedUrl: state.url
  });

  // Use AuthService's isAuthenticated which is properly initialized by APP_INITIALIZER
  if (isAuth && user) {
    console.log('✅ Auth Guard: Access granted');
    return true;
  }

  // User is not authenticated, redirect to login with return URL
  console.log('❌ Auth Guard: Access denied, redirecting to login');
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: state.url },
  });
};
