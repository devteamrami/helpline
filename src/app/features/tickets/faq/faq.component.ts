/**
 * FAQ Component
 * Displays FAQ entries with search, status filter, create/edit modal, active toggle.
 *
 * Route: /faqs
 * Guard: authGuard + roleGuard(['admin','superadmin'])
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, ViewContainerRef, ComponentRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { FaqService } from '../services/faq.service';
import { Faq } from '../models/ticket.model';
import { FaqFormDialogComponent } from './faq-form-dialog/faq-form-dialog.component';

@Component({
  selector: 'app-faq',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './faq.component.html',
  styleUrls: ['./faq.component.scss'],
})
export class FaqComponent implements OnInit, OnDestroy {
  private faqService = inject(FaqService);
  private cdr = inject(ChangeDetectorRef);
  private viewContainerRef = inject(ViewContainerRef);
  private ngZone = inject(NgZone);
  private destroy$ = new Subject<void>();

  private dialogRef: ComponentRef<FaqFormDialogComponent> | null = null;

  // ── State ──────────────────────────────────────────────────────────────────
  faqs: Faq[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  // ── Filters ────────────────────────────────────────────────────────────────
  searchControl = new FormControl('');
  statusFilter = new FormControl('');

  statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────────
  currentPage = 1;
  pageSize = 20;
  totalItems = 0;
  totalPages = 0;

  // ── Delete ─────────────────────────────────────────────────────────────────
  deletingId: string | null = null;
  deleteError = '';

  // ── Toggle active ──────────────────────────────────────────────────────────
  togglingId: string | null = null;

  // ──────────────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 1; this.loadFaqs(); });

    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => { this.currentPage = 1; this.loadFaqs(); });

    this.loadFaqs();
  }

  ngOnDestroy(): void {
    this.closeDialog();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Load ───────────────────────────────────────────────────────────────────

  loadFaqs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.faqService
      .getFaqs({
        page: this.currentPage,
        limit: this.pageSize,
        search: this.searchControl.value || undefined,
        status: (this.statusFilter.value as any) || undefined,
      })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.faqs = response.faqs;
          this.totalItems = response.pagination.totalItems;
          this.totalPages = response.pagination.totalPages;
          this.currentPage = response.pagination.currentPage;
          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.errorMessage = err.message || 'Failed to load FAQs';
          this.isLoading = false;
          this.cdr.detectChanges();
        },
      });
  }

  retry(): void { this.loadFaqs(); }

  // ── Pagination ─────────────────────────────────────────────────────────────

  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadFaqs();
  }

  getPageNumbers(): number[] {
    const maxVisible = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    const end = Math.min(this.totalPages, start + maxVisible - 1);
    if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
  }

  // ── Create dialog ──────────────────────────────────────────────────────────

  openCreateDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(FaqFormDialogComponent);
    document.body.appendChild(this.dialogRef.location.nativeElement);

    this.dialogRef.instance.data = { mode: 'create' };
    this.dialogRef.instance.onClose = () => this.ngZone.run(() => this.closeDialog());
    this.dialogRef.instance.onSuccess = () => {
      this.ngZone.run(() => {
        this.successMessage = 'FAQ created successfully';
        this.currentPage = 1;
        this.closeDialog();
        this.loadFaqs();
        this.clearSuccessAfterDelay();
      });
    };
  }

  // ── Edit dialog ────────────────────────────────────────────────────────────

  openEditDialog(faq: Faq, event: Event): void {
    event.stopPropagation();
    this.dialogRef = this.viewContainerRef.createComponent(FaqFormDialogComponent);
    document.body.appendChild(this.dialogRef.location.nativeElement);

    this.dialogRef.instance.data = { mode: 'edit', faq };
    this.dialogRef.instance.onClose = () => this.ngZone.run(() => this.closeDialog());
    this.dialogRef.instance.onSuccess = (updatedFaq: Faq) => {
      this.ngZone.run(() => {
        this.successMessage = 'FAQ updated successfully';
        this.closeDialog();
        // Immediately patch the local array so re-opening Edit shows fresh data
        const index = this.faqs.findIndex(f => f.id === updatedFaq.id);
        if (index >= 0) {
          this.faqs[index] = { ...this.faqs[index], ...updatedFaq };
        }
        this.cdr.detectChanges();
        this.loadFaqs();
        this.clearSuccessAfterDelay();
      });
    };
  }

  private closeDialog(): void {
    if (this.dialogRef) {
      const el = this.dialogRef.location.nativeElement;
      if (el.parentNode) el.parentNode.removeChild(el);
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  // ── Toggle active status ───────────────────────────────────────────────────

  toggleActive(faq: Faq, event: Event): void {
    event.stopPropagation();
    this.togglingId = faq.id;

    this.faqService.updateFaq(faq.id, { isActive: !faq.isActive })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.togglingId = null;
          this.loadFaqs();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.togglingId = null;
          this.deleteError = err.message || 'Failed to update FAQ status';
          this.cdr.detectChanges();
        },
      });
  }

  // ── Delete ─────────────────────────────────────────────────────────────────

  deleteFaq(faqId: string, event: Event): void {
    event.stopPropagation();
    if (!confirm('Are you sure you want to delete this FAQ? This action cannot be undone.')) return;

    this.deletingId = faqId;
    this.deleteError = '';

    this.faqService.deleteFaq(faqId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.deletingId = null;
          this.successMessage = 'FAQ deleted successfully';
          if (this.faqs.length === 1 && this.currentPage > 1) this.currentPage--;
          this.loadFaqs();
          this.clearSuccessAfterDelay();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.deleteError = err.message || 'Failed to delete FAQ';
          this.deletingId = null;
          this.cdr.detectChanges();
        },
      });
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  truncate(text: string, maxLength = 120): string {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '…' : text;
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    });
  }

  private clearSuccessAfterDelay(): void {
    setTimeout(() => { this.successMessage = ''; this.cdr.detectChanges(); }, 3000);
  }
}
