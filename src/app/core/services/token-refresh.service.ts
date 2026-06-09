/**
 * Token Refresh Service
 * Automatically refreshes access tokens before they expire
 */

import { Injectable, inject } from '@angular/core';
import { AuthService } from './auth.service';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class TokenRefreshService {
  private authService = inject(AuthService);
  private refreshSubscription?: Subscription;
  private readonly CHECK_INTERVAL = 60000; // Check every 60 seconds
  private readonly REFRESH_THRESHOLD = 120000; // Refresh 2 minutes before expiry

  /**
   * Start automatic token refresh
   */
  startTokenRefresh(): void {
    this.stopTokenRefresh(); // Clear any existing subscription

    this.refreshSubscription = interval(this.CHECK_INTERVAL).subscribe(() => {
      this.checkAndRefreshToken();
    });

    console.log('🔄 Token refresh service started');
  }

  /**
   * Stop automatic token refresh
   */
  stopTokenRefresh(): void {
    if (this.refreshSubscription) {
      this.refreshSubscription.unsubscribe();
      this.refreshSubscription = undefined;
      console.log('⏹️ Token refresh service stopped');
    }
  }

  /**
   * Check if token needs refresh and refresh it
   */
  private checkAndRefreshToken(): void {
    const token = this.authService.getAccessToken();
    
    if (!token) {
      console.log('⚠️ No token found, stopping refresh service');
      this.stopTokenRefresh();
      return;
    }

    const tokenExpiry = this.getTokenExpiry(token);
    
    if (!tokenExpiry) {
      console.log('⚠️ Cannot decode token expiry');
      return;
    }

    const now = Date.now();
    const timeUntilExpiry = tokenExpiry - now;

    console.log(`⏰ Token expires in ${Math.floor(timeUntilExpiry / 1000)} seconds`);

    // Refresh if token expires in less than threshold
    if (timeUntilExpiry < this.REFRESH_THRESHOLD && timeUntilExpiry > 0) {
      console.log('🔄 Token expiring soon, refreshing...');
      this.refreshToken();
    } else if (timeUntilExpiry <= 0) {
      console.log('⚠️ Token already expired, refreshing...');
      this.refreshToken();
    }
  }

  /**
   * Refresh the access token
   */
  private refreshToken(): void {
    this.authService.refreshToken().subscribe({
      next: (newToken) => {
        console.log('✅ Token refreshed successfully');
      },
      error: (error) => {
        console.error('❌ Token refresh failed:', error);
        this.stopTokenRefresh();
        // Token refresh failed, user needs to login again
        this.authService.logout().subscribe();
      },
    });
  }

  /**
   * Get token expiry time from JWT
   */
  private getTokenExpiry(token: string): number | null {
    try {
      const payload = this.decodeToken(token);
      if (payload && payload.exp) {
        return payload.exp * 1000; // Convert to milliseconds
      }
      return null;
    } catch (error) {
      console.error('Error decoding token:', error);
      return null;
    }
  }

  /**
   * Decode JWT token
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      return null;
    }
  }
}
