/**
 * Activities Page Component
 * Full page showing all activities with pagination.
 */

import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { ActivityService } from './activity.service';
import { Activity, ActivityPagination } from './activity.model';

@Component({
  selector: 'app-activities',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './activities.component.html',
  styleUrls: ['./activities.component.scss'],
})
export class ActivitiesComponent implements OnInit, OnDestroy {
  private activityService = inject(ActivityService);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  activities: Activity[] = [];
  pagination: ActivityPagination = {
    currentPage: 1,
    itemsPerPage: 20,
    totalItems: 0,
    totalPages: 0,
  };
  loading = false;

  ngOnInit(): void {
    this.loadActivities(1);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadActivities(page: number): void {
    this.loading = true;
    this.activityService
      .getActivities(page, 20)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          this.activities = res.activities;
          this.pagination = res.pagination;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        },
      });
  }

  dismissActivity(id: string): void {
    if (confirm('Are you sure you want to dismiss this activity?')) {
      this.activityService
        .dismissActivity(id)
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.activities = this.activities.filter((a) => a.id !== id);
          this.pagination.totalItems--;
        });
    }
  }

  goToTicket(ticketId: string): void {
    this.router.navigate(['/tickets', ticketId]);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.pagination.totalPages) {
      this.loadActivities(page);
    }
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

  getPages(): number[] {
    const pages: number[] = [];
    const total = this.pagination.totalPages;
    const current = this.pagination.currentPage;
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
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
}
