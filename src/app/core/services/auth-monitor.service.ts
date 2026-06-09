/**
 * Auth Monitor Service
 * Monitors authentication state and redirects when tokens are removed
 */

import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { StorageService } from './storage.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthMonitorService {
  private router = inject(Router);
  private storage = inject(StorageService);
  private checkInterval: any;

  startMonitoring(): void {
    // Check auth state every second
    this.checkInterval = setInterval(() => {
      this.checkAuthState();
    }, 1000);
  }

  stopMonitoring(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  private checkAuthState(): void {
    const token = this.storage.getItem<string>(environment.tokenKey);
    const user = this.storage.getItem(environment.userKey);
    const currentUrl = this.router.url;
    const isAuthRoute = currentUrl.startsWith('/auth');

    // If on protected route but no token, redirect to login
    if (!token && !isAuthRoute) {
      console.log('⚠️ Auth Monitor: Token removed, redirecting to login');
      this.router.navigate(['/auth/login'], {
        queryParams: { returnUrl: currentUrl }
      });
    }

    // If on auth route but has token, redirect to dashboard
    if (token && user && isAuthRoute) {
      console.log('⚠️ Auth Monitor: Token found, redirecting to dashboard');
      this.router.navigate(['/dashboard']);
    }
  }
}
