/**
 * Root Redirect Guard
 * Intelligently redirects to dashboard or login based on auth status
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const rootRedirectGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user has valid authentication
  const token = authService.getAccessToken();
  const user = authService.currentUserValue;
  
  if (token && user) {
    // User is authenticated, go to dashboard
    router.navigate(['/dashboard']);
  } else {
    // User is not authenticated, go to login
    router.navigate(['/auth/login']);
  }
  
  return false; // Prevent navigation to empty route
};
