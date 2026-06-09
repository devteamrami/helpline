/**
 * Guest CanMatch Guard
 * Prevents auth routes from being matched if already authenticated
 * This is the REAL industry-standard approach - no navigation happens at all
 */

import { inject } from '@angular/core';
import { Router, CanMatchFn, UrlTree } from '@angular/router';
import { StorageService } from '../services/storage.service';
import { environment } from '../../../environments/environment';

export const guestCanMatchGuard: CanMatchFn = (): boolean | UrlTree => {
  const storage = inject(StorageService);
  const router = inject(Router);

  // Direct localStorage check - synchronous and instant
  const token = storage.getItem<string>(environment.tokenKey);
  const user = storage.getItem(environment.userKey);
  
  if (token && user) {
    // User is already authenticated, redirect to dashboard
    return router.createUrlTree(['/dashboard']);
  }

  // Not authenticated, allow access to auth pages
  return true;
};
