/**
 * Project List Component
 * Displays projects in a table with pagination, search, and filters
 */

import { Component, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged } from 'rxjs/operators';

import { ProjectService } from '../../../core/services/project.service';
import { AuthService } from '../../../core/services/auth.service';
import { Project, ProjectStatus } from '../../../core/models/project.model';
import { ProjectFormDialogComponent } from '../project-form-dialog/project-form-dialog.component';

@Component({
  selector: 'app-project-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule
  ],
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.scss']
})
export class ProjectListComponent implements OnInit, OnDestroy {
  private projectService = inject(ProjectService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Dialog reference
  private dialogRef: ComponentRef<ProjectFormDialogComponent> | null = null;

  // Data
  projects: Project[] = [];
  isLoading = false;
  errorMessage = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchControl = new FormControl('');
  statusFilter = new FormControl('');
  sortBy = 'created_at';  // Changed from 'createdAt' to 'created_at'
  sortOrder: 'asc' | 'desc' = 'desc';

  // Status options
  statusOptions: ProjectStatus[] = ['Active', 'On Hold', 'Completed', 'Archived'];

  // Permissions
  canCreateProject = false;
  canEditProject = false;
  canArchiveProject = false;

  ngOnInit(): void {
    this.checkPermissions();
    this.setupSearchDebounce();
    this.setupStatusFilter();
    this.loadProjects();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Check user permissions
   */
  private checkPermissions(): void {
    const currentUser = this.authService.currentUserValue;
    const userRole = currentUser?.role || '';
    this.canCreateProject = ['superadmin', 'admin'].includes(userRole);
    this.canEditProject = ['superadmin', 'admin'].includes(userRole);
    this.canArchiveProject = ['superadmin', 'admin'].includes(userRole);
  }

  /**
   * Setup search input debounce
   */
  private setupSearchDebounce(): void {
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1;
        this.loadProjects();
      });
  }

  /**
   * Setup status filter
   */
  private setupStatusFilter(): void {
    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadProjects();
      });
  }

  /**
   * Load projects from API
   */
  loadProjects(): void {
    console.log('🔄 Loading projects...');
    this.isLoading = true;
    this.errorMessage = '';

    const params = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      search: this.searchControl.value || undefined,
      status: (this.statusFilter.value as ProjectStatus) || undefined,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    };

    console.log('📤 Request params:', params);

    this.projectService.getProjects(params)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('✅ Projects loaded:', response);
          this.projects = response.projects;
          this.totalItems = response.pagination.totalItems;
          this.totalPages = response.pagination.totalPages;
          this.isLoading = false;
          console.log('🎯 Triggering change detection');
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('❌ Error loading projects:', error);
          this.errorMessage = error.message;
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProjects();
  }

  /**
   * Handle sort change
   */
  onSort(column: string): void {
    if (this.sortBy === column) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'desc';
    }
    this.loadProjects();
  }

  /**
   * Navigate to project detail
   */
  viewProject(projectId: string): void {
    this.router.navigate(['/projects', projectId]);
  }

  /**
   * Open create project dialog
   */
  openCreateDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(ProjectFormDialogComponent);
    
    // Append to document body for proper overlay positioning
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    // Set dialog data
    this.dialogRef.instance.data = {
      mode: 'create'
    };

    // Set callbacks
    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      this.loadProjects(); // Reload list after creation
    };
  }

  /**
   * Open edit project dialog
   */
  openEditDialog(project: Project, event: Event): void {
    event.stopPropagation();
    
    this.dialogRef = this.viewContainerRef.createComponent(ProjectFormDialogComponent);
    
    // Append to document body for proper overlay positioning
    document.body.appendChild(this.dialogRef.location.nativeElement);
    
    // Set dialog data
    this.dialogRef.instance.data = {
      mode: 'edit',
      project: project
    };

    // Set callbacks
    this.dialogRef.instance.onClose = () => {
      this.closeDialog();
    };

    this.dialogRef.instance.onSuccess = () => {
      this.loadProjects(); // Reload list after update
    };
  }

  /**
   * Close dialog
   */
  private closeDialog(): void {
    if (this.dialogRef) {
      // Remove from document body
      const element = this.dialogRef.location.nativeElement;
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  /**
   * Archive project
   */
  archiveProject(project: Project, event: Event): void {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to archive "${project.name}"?`)) {
      return;
    }

    this.projectService.archiveProject(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          alert(`Failed to archive project: ${error.message}`);
        }
      });
  }

  /**
   * Unarchive project
   */
  unarchiveProject(project: Project, event: Event): void {
    event.stopPropagation();
    
    if (!confirm(`Are you sure you want to unarchive "${project.name}"?`)) {
      return;
    }

    this.projectService.unarchiveProject(project.id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.loadProjects();
        },
        error: (error) => {
          alert(`Failed to unarchive project: ${error.message}`);
        }
      });
  }

  /**
   * Get status badge class
   */
  getStatusClass(status: ProjectStatus): string {
    const statusClasses: Record<ProjectStatus, string> = {
      'Active': 'status-active',
      'On Hold': 'status-on-hold',
      'Completed': 'status-completed',
      'Archived': 'status-archived'
    };
    return statusClasses[status] || '';
  }

  /**
   * Retry loading projects
   */
  retry(): void {
    this.loadProjects();
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxPages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxPages - 1);

    if (endPage - startPage < maxPages - 1) {
      startPage = Math.max(1, endPage - maxPages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  }
}
