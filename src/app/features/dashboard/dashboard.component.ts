/**
 * Dashboard Component
 * Main dashboard with modern, reactive design
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { Subject, takeUntil } from 'rxjs';
import { DashboardService, DashboardStats } from './dashboard.service';
import { ActivityService } from '../activities/activity.service';
import { Activity } from '../activities/activity.model';
import { NotificationService } from '../../core/services/notification.service';

interface StatCard {
  title: string;
  value: number;
  change: number;
  icon: string;
  color: string;
  trend: 'up' | 'down';
}

interface Project {
  id: string;
  name: string;
  progress: number;
  status: 'active' | 'completed' | 'on-hold';
  team: number;
  dueDate: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private dashboardService = inject(DashboardService);
  private activityService = inject(ActivityService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  currentTime: Date = new Date();
  greeting: string = '';
  dashboardStats: DashboardStats | null = null;
  unseenCount = 0;
  bellJiggle = false;

  stats: StatCard[] = [
    {
      title: 'Total Projects',
      value: 12,
      change: 12,
      icon: 'projects',
      color: 'purple',
      trend: 'up'
    },
    {
      title: 'Active Tasks',
      value: 48,
      change: 8,
      icon: 'tasks',
      color: 'blue',
      trend: 'up'
    },
    {
      title: 'Team Members',
      value: 24,
      change: 3,
      icon: 'team',
      color: 'green',
      trend: 'up'
    },
    {
      title: 'Completed',
      value: 156,
      change: 15,
      icon: 'completed',
      color: 'orange',
      trend: 'up'
    }
  ];

  recentActivities: Activity[] = [];

  activeProjects: Project[] = [
    {
      id: '1',
      name: 'Website Redesign',
      progress: 75,
      status: 'active',
      team: 5,
      dueDate: '2024-02-15'
    },
    {
      id: '2',
      name: 'Mobile App Development',
      progress: 45,
      status: 'active',
      team: 8,
      dueDate: '2024-03-01'
    },
    {
      id: '3',
      name: 'API Integration',
      progress: 90,
      status: 'active',
      team: 3,
      dueDate: '2024-01-30'
    },
    {
      id: '4',
      name: 'Database Migration',
      progress: 30,
      status: 'on-hold',
      team: 4,
      dueDate: '2024-02-20'
    }
  ];

  constructor() {
    // Load data AFTER hydration is complete (client-side only)
    afterNextRender(() => {
      this.loadDashboardData();
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.updateGreeting();
      });

    setInterval(() => {
      this.currentTime = new Date();
      this.updateGreeting();
    }, 60000);
  }

  private loadDashboardData(): void {
    // Load stats
    this.dashboardService.getStats()
      .pipe(takeUntil(this.destroy$))
      .subscribe((data) => {
        if (data) {
          this.dashboardStats = data;
          this.cdr.markForCheck();
          this.cdr.detectChanges();
        }
      });

    // Load activities
    this.activityService.getActivities(1, 5)
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.recentActivities = res.activities;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });

    // Subscribe to notification state
    this.notificationService.unseenCount$
      .pipe(takeUntil(this.destroy$))
      .subscribe((count) => {
        this.unseenCount = count;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
    this.notificationService.shouldJiggle$
      .pipe(takeUntil(this.destroy$))
      .subscribe((jiggle) => {
        this.bellJiggle = jiggle;
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      });
  }

  dismissActivity(id: string): void {
    if (confirm('Are you sure you want to dismiss this activity?')) {
      this.activityService.dismissActivity(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.recentActivities = this.recentActivities.filter(a => a.id !== id);
        });
    }
  }

  goToTicket(ticketId: string): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  goToActivities(): void {
    this.router.navigate(['/activities']);
  }

  onBellClick(): void {
    this.notificationService.markAsSeen();
    this.router.navigate(['/activities']);
  }

  getRelativeTime(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    const day = date.getDate();
    const suffix = this.getDaySuffix(day);
    const month = date.toLocaleString('en-US', { month: 'long' });
    const year = date.getFullYear();
    return `${day}${suffix} ${month} ${year}`;
  }

  private getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  updateGreeting(): void {
    const hour = this.currentTime.getHours();
    if (hour < 12) {
      this.greeting = 'Good Morning';
    } else if (hour < 18) {
      this.greeting = 'Good Afternoon';
    } else {
      this.greeting = 'Good Evening';
    }
  }

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

  getStatusClass(status: string): string {
    const classes: { [key: string]: string } = {
      'active': 'status-active',
      'completed': 'status-completed',
      'on-hold': 'status-hold'
    };
    return classes[status] || '';
  }

  getProgressColor(progress: number): string {
    if (progress >= 75) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  }

  getUserInitials(): string {
    if (!this.currentUser) return 'U';
    
    const firstName = this.currentUser.firstName || '';
    const lastName = this.currentUser.lastName || '';
    
    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }
    
    return (this.currentUser.username || 'U')[0].toUpperCase();
  }

  getRoleBadgeClass(): string {
    const role = this.currentUser?.role?.toLowerCase() || '';
    const classes: { [key: string]: string } = {
      'superadmin': 'role-superadmin',
      'admin': 'role-admin',
      'manager': 'role-manager',
      'developer': 'role-developer',
      'viewer': 'role-viewer'
    };
    return classes[role] || 'role-default';
  }
}
