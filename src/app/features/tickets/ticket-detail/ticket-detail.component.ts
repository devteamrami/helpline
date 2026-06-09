/**
 * Ticket Detail Component
 * Displays a single ticket's full conversation thread and provides reply/status-update controls.
 *
 * Requirements: 6.6, 6.7, 6.8, 6.9, 6.10, 6.11, 6.12
 */

import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

// Angular Material
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { TicketService } from '../services/ticket.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  TicketDetail,
  ConversationEntry,
  TicketStatus,
} from '../models/ticket.model';

// ─── Accepted MIME types (mirrors backend allowlist) ─────────────────────────
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB
const MAX_FILE_COUNT = 5;

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
})
export class TicketDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // ── State ───────────────────────────────────────────────────────────────────

  ticket: TicketDetail | null = null;
  conversations: ConversationEntry[] = [];

  isLoading = true;
  loadError: string | null = null;

  // Reply form
  replyControl = new FormControl('', [
    Validators.required,
    Validators.maxLength(5000),
  ]);
  selectedFiles: File[] = [];
  fileError: string | null = null;
  isSubmitting = false;
  replyError: string | null = null;

  // Status dropdown
  statusControl = new FormControl<TicketStatus>('open');
  previousStatus: TicketStatus = 'open';
  statusError: string | null = null;
  isUpdatingStatus = false;

  // Available statuses for the dropdown
  readonly statusOptions: { value: TicketStatus; label: string }[] = [
    { value: 'open', label: 'Open' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'closed', label: 'Closed' },
  ];

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    const id = this.route.snapshot.params['id'];
    if (id) {
      this.loadTicket(id);
    } else {
      this.loadError = 'No ticket ID provided.';
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data loading ────────────────────────────────────────────────────────────

  loadTicket(id: string): void {
    this.isLoading = true;
    this.loadError = null;

    this.ticketService
      .getTicketById(id)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          // ALWAYS reset loading — even if interceptor swallows the response
          this.isLoading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (detail) => {
          this.ticket = detail;
          this.conversations = [...(detail.conversations ?? [])];
          this.statusControl.setValue(detail.status);
          this.previousStatus = detail.status;
        },
        error: (err) => {
          this.loadError = err.message || 'Failed to load ticket.';
        },
      });
  }

  // ── File input handling ─────────────────────────────────────────────────────

  isDragOver = false;
  private previewUrls = new Map<File, string>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.addFiles(Array.from(files));
    }
  }

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      this.addFiles(imageFiles);
    }
  }

  // Listen for paste anywhere on the page (not just textarea)
  @HostListener('document:paste', ['$event'])
  onDocumentPaste(event: ClipboardEvent): void {
    // Only capture if we're on this page and ticket is loaded
    if (!this.ticket) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }

    if (imageFiles.length > 0) {
      event.preventDefault();
      this.addFiles(imageFiles);
      this.cdr.detectChanges();
    }
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.addFiles(Array.from(input.files));
    input.value = '';
  }

  private addFiles(newFiles: File[]): void {
    this.fileError = null;

    for (const file of newFiles) {
      if (this.selectedFiles.length >= MAX_FILE_COUNT) {
        this.fileError = `Maximum ${MAX_FILE_COUNT} files allowed.`;
        break;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        this.fileError = `"${file.name}" exceeds 10 MB limit.`;
        continue;
      }
      if (!ACCEPTED_MIME_TYPES.has(file.type)) {
        this.fileError = `"${file.name}" is not a supported file type.`;
        continue;
      }
      this.selectedFiles = [...this.selectedFiles, file];
    }
  }

  getPreviewUrl(file: File): string {
    if (!this.previewUrls.has(file)) {
      this.previewUrls.set(file, URL.createObjectURL(file));
    }
    return this.previewUrls.get(file)!;
  }

  // ── Image Editor for Attachments ────────────────────────────────────────────

  showAttachmentEditor = false;
  isApplyingAttachmentEdit = false;
  private editingFileIndex = -1;
  private attachmentTuiEditor: any = null;

  openImageEditorForFile(index: number, event: Event): void {
    event.stopPropagation();
    const file = this.selectedFiles[index];
    if (!file || !file.type.startsWith('image/')) return;

    this.editingFileIndex = index;
    this.showAttachmentEditor = true;

    const src = this.getPreviewUrl(file);
    setTimeout(() => this.initAttachmentEditor(src), 100);
  }

  private async initAttachmentEditor(imageSrc: string): Promise<void> {
    const container = document.getElementById('attachment-editor-container');
    if (!container) return;

    const ImageEditor = (await import('tui-image-editor')).default;
    this.destroyAttachmentEditor();

    this.attachmentTuiEditor = new ImageEditor(container, {
      includeUI: {
        loadImage: { path: imageSrc, name: 'Attachment' },
        theme: {
          'common.bi.image': '',
          'common.bisize.width': '0px',
          'common.bisize.height': '0px',
          'common.backgroundImage': 'none',
          'common.backgroundColor': '#1e1e2e',
          'common.border': '0px',
          'header.backgroundImage': 'none',
          'header.backgroundColor': '#667eea',
          'header.border': '0px',
          'loadButton.backgroundColor': '#667eea',
          'loadButton.border': 'none',
          'loadButton.color': '#fff',
          'downloadButton.backgroundColor': '#764ba2',
          'downloadButton.border': 'none',
          'downloadButton.color': '#fff',
          'menu.normalIcon.color': '#eee',
          'menu.activeIcon.color': '#fff',
          'menu.disabledIcon.color': '#555',
          'menu.hoverIcon.color': '#fff',
          'submenu.normalIcon.color': '#eee',
          'submenu.activeIcon.color': '#fff',
        } as any,
        menu: ['crop', 'flip', 'rotate', 'draw', 'shape', 'icon', 'text', 'mask', 'filter'],
        initMenu: 'draw',
        uiSize: { width: '100%', height: '540px' },
        menuBarPosition: 'bottom',
      },
      cssMaxWidth: 900,
      cssMaxHeight: 480,
      usageStatistics: false,
    });

    document.body.removeAttribute('dir');
    document.documentElement.setAttribute('dir', 'ltr');
  }

  applyAttachmentEdit(): void {
    if (!this.attachmentTuiEditor || this.editingFileIndex < 0) {
      this.closeAttachmentEditor();
      return;
    }

    this.isApplyingAttachmentEdit = true;

    const dataUrl = this.attachmentTuiEditor.toDataURL({ format: 'jpeg', quality: 0.85 });

    // Convert data URL to File and replace in the selectedFiles array
    fetch(dataUrl)
      .then(r => r.blob())
      .then(blob => {
        const originalFile = this.selectedFiles[this.editingFileIndex];
        const editedFile = new File([blob], originalFile?.name || 'edited.jpg', { type: 'image/jpeg' });

        // Replace the file at the index
        const newFiles = [...this.selectedFiles];
        newFiles[this.editingFileIndex] = editedFile;
        this.selectedFiles = newFiles;

        // Update the preview URL for the new file
        if (originalFile) {
          const oldUrl = this.previewUrls.get(originalFile);
          if (oldUrl) URL.revokeObjectURL(oldUrl);
          this.previewUrls.delete(originalFile);
        }
        this.previewUrls.set(editedFile, URL.createObjectURL(editedFile));

        this.isApplyingAttachmentEdit = false;
        this.closeAttachmentEditor();
        this.cdr.detectChanges();
      })
      .catch(() => {
        this.isApplyingAttachmentEdit = false;
        this.closeAttachmentEditor();
      });
  }

  closeAttachmentEditor(): void {
    this.showAttachmentEditor = false;
    this.editingFileIndex = -1;
    this.destroyAttachmentEditor();
  }

  private destroyAttachmentEditor(): void {
    if (this.attachmentTuiEditor) {
      try { this.attachmentTuiEditor.destroy(); } catch {}
      this.attachmentTuiEditor = null;
    }
  }

  removeFile(index: number): void {
    this.selectedFiles = this.selectedFiles.filter((_, i) => i !== index);
    this.fileError = null;
  }

  // ── Reply submission ────────────────────────────────────────────────────────

  submitReply(): void {
    if (this.replyControl.invalid || !this.ticket) {
      this.replyControl.markAsTouched();
      return;
    }

    const currentUser = this.authService.currentUserValue;
    const senderId = currentUser?.id ?? '';

    const formData = new FormData();
    formData.append('sender_type', 'staff');
    formData.append('sender_id', senderId);
    formData.append('message', this.replyControl.value ?? '');

    this.selectedFiles.forEach((file) => {
      formData.append('files', file, file.name);
    });

    this.isSubmitting = true;
    this.replyError = null;

    this.ticketService
      .addConversation(this.ticket.id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (entry) => {
          // Append new entry to thread without reload (Requirement 6.9)
          this.conversations = [...this.conversations, entry];
          // Reset form
          this.replyControl.reset('');
          this.replyControl.markAsUntouched();
          this.selectedFiles = [];
          this.fileError = null;
          this.isSubmitting = false;
        },
        error: (err) => {
          // Preserve draft; show inline error (Requirement 6.10)
          this.replyError = err.message || 'Failed to submit reply. Please try again.';
          this.isSubmitting = false;
        },
      });
  }

  // ── Status update ───────────────────────────────────────────────────────────

  onStatusChange(newStatus: TicketStatus): void {
    if (!this.ticket || newStatus === this.previousStatus) {
      return;
    }

    this.isUpdatingStatus = true;
    this.statusError = null;

    this.ticketService
      .updateTicketStatus(this.ticket.id, newStatus)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updated) => {
          // Persist the new status
          this.previousStatus = updated.status;
          if (this.ticket) {
            this.ticket = { ...this.ticket, status: updated.status };
          }
          this.isUpdatingStatus = false;
        },
        error: (err) => {
          // Revert dropdown to previous value (Requirement 6.12)
          this.statusControl.setValue(this.previousStatus, { emitEvent: false });
          this.statusError = err.message || 'Failed to update status. Please try again.';
          this.isUpdatingStatus = false;
        },
      });
  }

  // ── Template helpers ────────────────────────────────────────────────────────

  goBack(): void {
    this.router.navigate(['/tickets']);
  }

  getStatusClass(status: TicketStatus): string {
    const map: Record<TicketStatus, string> = {
      open: 'status-open',
      in_progress: 'status-in-progress',
      resolved: 'status-resolved',
      closed: 'status-closed',
    };
    return map[status] ?? '';
  }

  getSenderLabel(senderType: 'user' | 'staff'): string {
    return senderType === 'staff' ? 'Staff' : 'User';
  }

  getSenderBadgeClass(senderType: 'user' | 'staff'): string {
    return senderType === 'staff' ? 'badge-staff' : 'badge-user';
  }

  formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getAttachmentFileName(s3Key: string, originalName: string): string {
    return originalName || s3Key.split('/').pop() || s3Key;
  }

  get replyCharCount(): number {
    return (this.replyControl.value ?? '').length;
  }
}
