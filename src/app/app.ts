import { Component, signal, OnInit, inject, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TokenRefreshService } from './core/services/token-refresh.service';
import { AuthService } from './core/services/auth.service';
import { AuthMonitorService } from './core/services/auth-monitor.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('ramiscope-project-management-system');
  
  private tokenRefreshService = inject(TokenRefreshService);
  private authService = inject(AuthService);
  private authMonitor = inject(AuthMonitorService);

  ngOnInit(): void {
    // Start auth monitoring
    this.authMonitor.startMonitoring();

    // Start token refresh if authenticated
    if (this.authService.getAccessToken()) {
      this.tokenRefreshService.startTokenRefresh();
    }

    // Subscribe to authentication state changes
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (isAuthenticated) {
        this.tokenRefreshService.startTokenRefresh();
      } else {
        this.tokenRefreshService.stopTokenRefresh();
      }
    });
  }

  ngOnDestroy(): void {
    // Stop auth monitoring when app is destroyed
    this.authMonitor.stopMonitoring();
  }
}
