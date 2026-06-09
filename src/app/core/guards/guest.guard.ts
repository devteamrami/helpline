/**
 * Guest Guard
 * Redirects authenticated users away from auth pages
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route: ActivatedRouteSnapshot): boolean | UrlTree => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const isAuth = authService.isAuthenticated;
  const user = authService.currentUserValue;
  
  const returnUrl = route.queryParams['returnUrl'];
  
  console.log('👤 Guest Guard Check:', {
    isAuthenticated: isAuth,
    hasUser: !!user,
    returnUrl: returnUrl
  });
  
  if (isAuth && user) {
    // User is authenticated, redirect to returnUrl or dashboard
    if (returnUrl) {
      console.log('✅ Guest Guard: User authenticated, redirecting to returnUrl:', returnUrl);
      // Parse the returnUrl and navigate to it
      return router.parseUrl(returnUrl);
    } else {
      console.log('✅ Guest Guard: User authenticated, redirecting to dashboard');
      return router.createUrlTree(['/dashboard']);
    }
  }

  console.log('✅ Guest Guard: Access granted to auth page');
  return true;
};
