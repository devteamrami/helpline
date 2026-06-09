/**
 * Task History Component
 * Displays audit trail and history timeline for a task
 */

import { Component, Input, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatChipsModule } from '@angular/material/chips';
import { TaskHistoryService } from '../../../core/services/task-history.service';
import { TaskHistory, HISTORY_ACTIONS } from '../../../core/models/task-history.model';

@Component({
  selector: 'app-task-history',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatTooltipModule,
    MatPaginatorModule,
    MatChipsModule
  ],
  templateUrl: './task-history.component.html',
  styleUrls: ['./task-history.component.scss']
})
export class TaskHistoryComponent implements OnInit {
  private historyService = inject(TaskHistoryService);
  private cdr = inject(ChangeDetectorRef);

  @Input() projectId!: string;
  @Input() taskId!: string;

  history: TaskHistory[] = [];
  historyActions = HISTORY_ACTIONS;
  isLoading: boolean = true;

  // Pagination
  currentPage: number = 1;
  pageSize: number = 50;
  totalItems: number = 0;
  totalPages: number = 0;

  ngOnInit(): void {
    this.loadHistory();
  }

  /**
   * Load history
   */
  loadHistory(page: number = 1): void {
    this.isLoading = true;
    this.currentPage = page;

    this.historyService.getHistory(
      this.projectId,
      this.taskId,
      page,
      this.pageSize
    ).subscribe({
      next: (response) => {
        this.history = response.history;
        this.totalItems = response.pagination.totalItems;
        this.totalPages = response.pagination.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading history:', error);
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Handle page change
   */
  onPageChange(event: PageEvent): void {
    this.pageSize = event.pageSize;
    this.loadHistory(event.pageIndex + 1);
  }

  /**
   * Get action info
   */
  getActionInfo(action: string) {
    return this.historyActions.find(a => a.value === action) || {
      value: action,
      label: action,
      icon: 'info',
      color: '#6c757d'
    };
  }

  /**
   * Get user display name
   */
  getUserName(entry: TaskHistory): string {
    return `${entry.user.firstName} ${entry.user.lastName}`.trim() || entry.user.username;
  }

  /**
   * Format date
   */
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  }

  /**
   * Format full date
   */
  formatFullDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Get formatted history entry
   */
  getFormattedEntry(entry: TaskHistory): string {
    return this.historyService.formatHistoryEntry(entry);
  }

  /**
   * Check if entry has value changes
   */
  hasValueChanges(entry: TaskHistory): boolean {
    return entry.oldValue !== null || entry.newValue !== null;
  }
}
