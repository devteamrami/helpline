/**
 * Auth CanMatch Guard
 * Prevents route from being matched if not authenticated
 * This is the REAL industry-standard approach - no navigation happens at all
 */

import { inject } from '@angular/core';
import { Router, CanMatchFn, Route, UrlSegment, UrlTree } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { environment } from '../../../environments/environment';

export const authCanMatchGuard: CanMatchFn = (
  route: Route,
  segments: UrlSegment[]
): boolean | UrlTree => {
  const storage = inject(StorageService);
  const router = inject(Router);

  // Direct localStorage check - synchronous and instant
  const token = storage.getItem<string>(environment.tokenKey);
  const user = storage.getItem(environment.userKey);
  
  if (token && user) {
    // User is authenticated, allow route to match
    return true;
  }

  // Not authenticated, redirect to login
  const url = '/' + segments.map(s => s.path).join('/');
  return router.createUrlTree(['/auth/login'], {
    queryParams: { returnUrl: url || '/dashboard' },
  });
};
