/**
 * Ticket List Component
 * Displays support tickets in a styled table matching the app's design system.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { TicketService } from '../services/ticket.service';
import { Ticket, TicketStatus } from '../models/ticket.model';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
  ],
  templateUrl: './ticket-list.component.html',
  styleUrls: ['./ticket-list.component.scss'],
})
export class TicketListComponent implements OnInit, OnDestroy {
  private ticketService = inject(TicketService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // ── State ────────────────────────────────────────────────────────────────────
  tickets: Ticket[] = [];
  isLoading = false;
  errorMessage = '';

  // ── Filters ──────────────────────────────────────────────────────────────────
  searchControl = new FormControl('');
  statusFilter = new FormControl<TicketStatus | ''>('');

  statusOptions: Array<{ value: TicketStatus | ''; label: string }> = [
    { value: '', label: 'All Statuses' },
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  // ── Pagination ────────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.setupSearchDebounce();
    this.setupStatusFilter();
    this.loadTickets();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Private setup ─────────────────────────────────────────────────────────────

  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTickets();
      });
  }

  private setupStatusFilter(): void {
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadTickets();
      });
  }

  // ── Data loading ───────────────────────────────────────────────────────────────

  loadTickets(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.ticketService
      .getTickets({
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchControl.value || undefined,
        status: (this.statusFilter.value as TicketStatus) || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.tickets = response.tickets;
          this.totalItems = response.pagination.totalItems;
          this.totalPages = response.pagination.totalPages;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.errorMessage = error.message || 'Failed to load tickets. Please try again.';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Pagination ─────────────────────────────────────────────────────────────────

  onPageChangeDirect(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadTickets();
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) {
      start = Math.max(1, end - maxVisible + 1);
    }
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ── Row click ──────────────────────────────────────────────────────────────────

  onRowClick(ticket: Ticket): void {
    this.router.navigate(['/tickets', ticket.id]);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────────

  getStatusClass(status: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      open: 'status-open',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      closed: 'status-closed',
    };
    return map[status] ?? '';
  }

  getStatusLabel(status: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      open: 'Open',
      in_progress: 'In Progress',
      resolved: 'Resolved',
      closed: 'Closed',
    };
    return map[status] ?? status;
  }

  retry(): void {
    this.loadTickets();
  }
}
