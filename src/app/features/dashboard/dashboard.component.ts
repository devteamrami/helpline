/**
 * Dashboard Component
 * Main dashboard with modern, reactive design
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { User } from '../../core/models/user.model';
import { Subject, takeUntil } from 'rxjs';

interface StatCard {
  title: string;
  value: number;
  change: number;
  icon: string;
  color: string;
  trend: 'up' | 'down';
}

interface Activity {
  id: string;
  user: string;
  action: string;
  target: string;
  time: string;
  icon: string;
  color: string;
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
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  currentUser: User | null = null;
  currentTime: Date = new Date();
  greeting: string = '';

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

  recentActivities: Activity[] = [
    {
      id: '1',
      user: 'John Doe',
      action: 'completed task',
      target: 'Update user authentication',
      time: '5 minutes ago',
      icon: 'check',
      color: 'green'
    },
    {
      id: '2',
      user: 'Sarah Smith',
      action: 'created project',
      target: 'Mobile App Redesign',
      time: '1 hour ago',
      icon: 'plus',
      color: 'blue'
    },
    {
      id: '3',
      user: 'Mike Johnson',
      action: 'commented on',
      target: 'API Integration',
      time: '2 hours ago',
      icon: 'comment',
      color: 'purple'
    },
    {
      id: '4',
      user: 'Emily Brown',
      action: 'assigned task to',
      target: 'Database Optimization',
      time: '3 hours ago',
      icon: 'user',
      color: 'orange'
    }
  ];

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

  ngOnInit(): void {
    this.authService.currentUser$
      .pipe(takeUntil(this.destroy$))
      .subscribe((user) => {
        this.currentUser = user;
        this.updateGreeting();
      });

    // Update time every minute
    setInterval(() => {
      this.currentTime = new Date();
      this.updateGreeting();
    }, 60000);
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
