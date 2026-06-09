/**
 * Role Guard
 * Protects routes that require specific user roles
 */

import { inject } from '@angular/core';
import { Router, CanActivateFn, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Factory function that returns a CanActivateFn checking the current user's role.
 *
 * @param allowedRoles - Array of role strings permitted to access the route
 * @returns CanActivateFn that returns `true` when the user's role is in `allowedRoles`,
 *          or a UrlTree redirecting to `/unauthorized` otherwise
 */
export function roleGuard(allowedRoles: string[]): CanActivateFn {
  return (): boolean | UrlTree => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUserValue;

    console.log('🔐 Role Guard Check:', {
      userRole: user?.role,
      allowedRoles,
      hasAccess: !!(user?.role && allowedRoles.includes(user.role))
    });

    if (user && user.role && allowedRoles.includes(user.role)) {
      console.log('✅ Role Guard: Access granted for role', user.role);
      return true;
    }

    console.log('❌ Role Guard: Access denied, redirecting to /unauthorized');
    return router.createUrlTree(['/unauthorized']);
  };
}
