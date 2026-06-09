/**
 * User List Component
 * Displays users in a table with pagination, search, and filters
 */

import { Component, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { User, UserListParams } from '../../../core/models/user.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss'],
})
export class UserListComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Dialog reference
  private dialogRef: ComponentRef<UserFormDialogComponent> | null = null;

  // State
  users: User[] = [];
  isLoading = false;
  errorMessage = '';
  currentUser = this.authService.currentUserValue;

  // Pagination
  currentPage = 1;
  itemsPerPage = 20;
  totalItems = 0;
  totalPages = 0;

  // Filters
  searchControl = new FormControl('');
  roleFilter = new FormControl('');
  statusFilter = new FormControl('');

  // Available filter options
  roles = ['superadmin', 'admin', 'manager', 'developer', 'viewer'];
  statuses = [
    { value: '', label: 'All Status' },
    { value: 'true', label: 'Active' },
    { value: 'false', label: 'Inactive' },
  ];

  // Sort
  sortBy = 'createdAt';
  sortOrder: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    // Subscribe to search input with debounce
    this.searchControl.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.currentPage = 1; // Reset to first page on search
        this.loadUsers();
      });

    // Subscribe to filter changes
    this.roleFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });

    this.statusFilter.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.currentPage = 1;
        this.loadUsers();
      });

    // Initial load
    this.loadUsers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load users with current filters and pagination
   */
  loadUsers(): void {
    this.isLoading = true;
    this.errorMessage = '';

    const params: UserListParams = {
      page: this.currentPage,
      limit: this.itemsPerPage,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder,
    };

    // Add filters if set
    if (this.searchControl.value) {
      params.search = this.searchControl.value;
    }
    if (this.roleFilter.value) {
      params.role = this.roleFilter.value;
    }
    if (this.statusFilter.value !== '') {
      params.isActive = this.statusFilter.value === 'true';
    }

    this.userService.getUsers(params).subscribe({
      next: (response) => {
        this.users = response.users;
        this.currentPage = response.pagination.currentPage;
        this.itemsPerPage = response.pagination.itemsPerPage;
        this.totalItems = response.pagination.totalItems;
        this.totalPages = response.pagination.totalPages;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load users';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Handle page change
   */
  onPageChange(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadUsers();
  }

  /**
   * Handle sort change
   */
  onSortChange(column: string): void {
    if (this.sortBy === column) {
      // Toggle sort order
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = column;
      this.sortOrder = 'asc';
    }
    this.loadUsers();
  }

  /**
   * Navigate to user detail page
   */
  viewUser(userId: string): void {
    this.router.navigate(['/users', userId]);
  }

  /**
   * Open create user dialog
   */
  openCreateDialog(): void {
    this.dialogRef = this.viewContainerRef.createComponent(UserFormDialogComponent);
    this.dialogRef.instance.mode = 'create';
    this.dialogRef.instance.onClose = () => this.closeDialog();
    this.dialogRef.instance.onSuccess = (user) => {
      console.log('User created:', user);
      this.loadUsers(); // Reload the list
    };
  }

  /**
   * Open edit user dialog
   */
  openEditDialog(user: User): void {
    this.dialogRef = this.viewContainerRef.createComponent(UserFormDialogComponent);
    this.dialogRef.instance.mode = 'edit';
    this.dialogRef.instance.user = user;
    this.dialogRef.instance.onClose = () => this.closeDialog();
    this.dialogRef.instance.onSuccess = (updatedUser) => {
      console.log('User updated:', updatedUser);
      this.loadUsers(); // Reload the list
    };
  }

  /**
   * Close dialog
   */
  private closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.destroy();
      this.dialogRef = null;
    }
  }

  /**
   * Deactivate user with confirmation
   */
  deactivateUser(user: User): void {
    if (!confirm(`Are you sure you want to deactivate ${user.username}?`)) {
      return;
    }

    this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.loadUsers(); // Reload list
      },
      error: (error) => {
        alert(error.message || 'Failed to deactivate user');
      },
    });
  }

  /**
   * Activate user
   */
  activateUser(user: User): void {
    this.userService.activateUser(user.id).subscribe({
      next: () => {
        this.loadUsers(); // Reload list
      },
      error: (error) => {
        alert(error.message || 'Failed to activate user');
      },
    });
  }

  /**
   * Check if current user can edit users
   */
  canEditUsers(): boolean {
    const role = this.currentUser?.role?.toLowerCase();
    return role === 'superadmin' || role === 'admin';
  }

  /**
   * Check if current user can deactivate users
   */
  canDeactivateUsers(): boolean {
    const role = this.currentUser?.role?.toLowerCase();
    return role === 'superadmin';
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return (user.username || 'U')[0].toUpperCase();
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role?: string): string {
    const roleLower = role?.toLowerCase() || '';
    const classes: { [key: string]: string } = {
      superadmin: 'role-superadmin',
      admin: 'role-admin',
      manager: 'role-manager',
      developer: 'role-developer',
      viewer: 'role-viewer',
    };
    return classes[roleLower] || 'role-default';
  }

  /**
   * Get status badge class
   */
  getStatusBadgeClass(isActive?: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  /**
   * Get pagination range
   */
  getPaginationRange(): number[] {
    const range: number[] = [];
    const maxPages = 5;
    let start = Math.max(1, this.currentPage - Math.floor(maxPages / 2));
    let end = Math.min(this.totalPages, start + maxPages - 1);

    if (end - start < maxPages - 1) {
      start = Math.max(1, end - maxPages + 1);
    }

    for (let i = start; i <= end; i++) {
      range.push(i);
    }

    return range;
  }

  /**
   * Format date
   */
  formatDate(date?: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Retry loading users
   */
  retry(): void {
    this.loadUsers();
  }
}
