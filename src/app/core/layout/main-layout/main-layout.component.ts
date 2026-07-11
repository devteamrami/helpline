/**
 * Main Layout Component
 * Layout with navigation drawer for authenticated pages
 */

import { Component, OnInit, OnDestroy, inject, HostListener, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subject, filter, takeUntil } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { User } from '../../models/user.model';

interface MenuItem {
  label: string;
  icon?: string;
  route?: string;
  children?: MenuItem[];
  roles?: string[]; // Roles that can see this menu item
  expanded?: boolean;
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // State
  currentUser: User | null = null;
  isDrawerOpen = false;
  isMobile = false;
  currentRoute = '';

  // Notification bell state
  unseenCount = 0;
  bellJiggle = false;

  // Menu items
  menuItems: MenuItem[] = [
    {
      label: 'Dashboard',
      icon: 'dashboard',
      route: '/dashboard',
    },
    {
      label: 'Projects',
      icon: 'projects',
      children: [
        { label: 'All Projects', route: '/projects' },
        { label: 'My Projects', route: '/projects/my' },
        { label: 'Archived', route: '/projects/archived' },
      ],
    },
    {
      label: 'Tasks',
      icon: 'tasks',
      children: [
        { label: 'All Tasks', route: '/tasks' },
        { label: 'My Tasks', route: '/tasks/my' },
        { label: 'Assigned to Me', route: '/tasks/assigned' },
      ],
    },
    {
      label: 'Team',
      icon: 'team',
      children: [
        {
          label: 'Team Members',
          route: '/users',
          roles: ['superadmin', 'admin', 'manager'],
        },
        { label: 'Departments', route: '/team/departments' },
      ],
    },
    {
      label: 'Reports',
      icon: 'reports',
      route: '/reports',
    },
    {
      label: 'Administration',
      icon: 'admin',
      roles: ['superadmin', 'admin'],
      children: [
        {
          label: 'System Settings',
          route: '/settings',
          roles: ['superadmin', 'admin'],
        },
        {
          label: 'Audit Logs',
          route: '/audit',
          roles: ['superadmin', 'admin'],
        },
      ],
    },
    {
      label: 'Support Tickets',
      icon: 'tickets',
      route: '/tickets',
      roles: ['admin', 'superadmin', 'manager'],
    },
    {
      label: 'FAQs',
      icon: 'faqs',
      route: '/faqs',
      roles: ['admin', 'superadmin'],
    },
  ];

  constructor() {
    afterNextRender(() => {
      // Start polling AFTER hydration
      this.notificationService.startPolling();

      this.notificationService.unseenCount$
        .pipe(takeUntil(this.destroy$))
        .subscribe((count) => {
          this.unseenCount = count;
          this.cdr.detectChanges();
        });

      this.notificationService.shouldJiggle$
        .pipe(takeUntil(this.destroy$))
        .subscribe((jiggle) => {
          this.bellJiggle = jiggle;
          this.cdr.detectChanges();
        });
    });
  }

  ngOnInit(): void {
    // Get current user
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
      });

    // Check if mobile
    this.checkIfMobile();

    // Track route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: any) => {
        this.currentRoute = event.url;
        if (this.isMobile) {
          this.isDrawerOpen = false;
        }
      });

    // Set initial route
    this.currentRoute = this.router.url;
  }

  ngOnDestroy(): void {
    this.notificationService.stopPolling();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check if viewport is mobile
   */
  @HostListener('window:resize')
  checkIfMobile(): void {
    this.isMobile = window.innerWidth < 1024;
    // Auto-close drawer on mobile
    if (this.isMobile) {
      this.isDrawerOpen = false;
    }
  }

  /**
   * Toggle drawer
   */
  toggleDrawer(): void {
    this.isDrawerOpen = !this.isDrawerOpen;
  }

  /**
   * Close drawer
   */
  closeDrawer(): void {
    this.isDrawerOpen = false;
  }

  /**
   * Toggle menu item expansion
   */
  toggleMenuItem(item: MenuItem): void {
    if (item.children) {
      item.expanded = !item.expanded;
    } else if (item.route) {
      this.router.navigate([item.route]);
    }
  }

  /**
   * Navigate to route
   */
  navigateTo(route: string): void {
    this.router.navigate([route]);
  }

  /**
   * Check if menu item should be visible based on user role
   */
  canViewMenuItem(item: MenuItem): boolean {
    if (!item.roles || item.roles.length === 0) {
      return true; // No role restriction
    }

    const userRole = this.currentUser?.role?.toLowerCase();
    return item.roles.some((role) => role.toLowerCase() === userRole);
  }

  /**
   * Check if route is active
   */
  isRouteActive(route?: string): boolean {
    if (!route) return false;
    return this.currentRoute === route || this.currentRoute.startsWith(route + '/');
  }

  /**
   * Get user initials
   */
  getUserInitials(): string {
    if (!this.currentUser) return 'U';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName[0]}${this.currentUser.lastName[0]}`.toUpperCase();
    }

    return (this.currentUser.username || 'U')[0].toUpperCase();
  }

  /**
   * Get user display name
   */
  getUserDisplayName(): string {
    if (!this.currentUser) return 'User';

    if (this.currentUser.firstName && this.currentUser.lastName) {
      return `${this.currentUser.firstName} ${this.currentUser.lastName}`;
    }

    return this.currentUser.username;
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(): string {
    const role = this.currentUser?.role?.toLowerCase() || '';
    const classes: { [key: string]: string } = {
      superadmin: 'role-superadmin',
      admin: 'role-admin',
      manager: 'role-manager',
      developer: 'role-developer',
      viewer: 'role-viewer',
    };
    return classes[role] || 'role-default';
  }

  /**
   * Handle notification bell click
   */
  onBellClick(): void {
    this.notificationService.markAsSeen();
    this.router.navigate(['/activities']);
  }

  /**
   * Logout
   */
  logout(): void {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        console.error('Logout error:', error);
        this.router.navigate(['/auth/login']);
      },
    });
  }

  /**
   * Handle swipe gestures
   */
  private touchStartX = 0;
  private touchEndX = 0;

  @HostListener('touchstart', ['$event'])
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.changedTouches[0].screenX;
  }

  @HostListener('touchend', ['$event'])
  onTouchEnd(event: TouchEvent): void {
    this.touchEndX = event.changedTouches[0].screenX;
    this.handleSwipe();
  }

  /**
   * Handle swipe gesture
   */
  private handleSwipe(): void {
    const swipeThreshold = 50;
    const diff = this.touchEndX - this.touchStartX;

    // Swipe right to open (from left edge)
    if (diff > swipeThreshold && this.touchStartX < 50 && !this.isDrawerOpen) {
      this.isDrawerOpen = true;
    }

    // Swipe left to close
    if (diff < -swipeThreshold && this.isDrawerOpen) {
      this.isDrawerOpen = false;
    }
  }
}
