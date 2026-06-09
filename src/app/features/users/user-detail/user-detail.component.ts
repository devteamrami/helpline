/**
 * User Detail Component
 * Displays complete user profile with project memberships
 */

import { Component, OnInit, OnDestroy, inject, ViewContainerRef, ComponentRef, ChangeDetectorRef } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

import { UserService } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UserDetail } from '../../../core/models/user.model';
import { UserFormDialogComponent } from '../user-form-dialog/user-form-dialog.component';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-detail.component.html',
  styleUrls: ['./user-detail.component.scss'],
})
export class UserDetailComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private viewContainerRef = inject(ViewContainerRef);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  // Dialog reference
  private dialogRef: ComponentRef<UserFormDialogComponent> | null = null;

  // State
  user: UserDetail | null = null;
  isLoading = false;
  errorMessage = '';
  currentUser = this.authService.currentUserValue;

  ngOnInit(): void {
    // Get user ID from route
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserDetail(userId);
    } else {
      this.errorMessage = 'Invalid user ID';
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load user details
   */
  loadUserDetail(userId: string): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.userService.getUserById(userId).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.errorMessage = error.message || 'Failed to load user details';
        this.isLoading = false;
        this.cdr.detectChanges();
      },
    });
  }

  /**
   * Open edit dialog
   */
  openEditDialog(): void {
    if (!this.user) return;
    
    this.dialogRef = this.viewContainerRef.createComponent(UserFormDialogComponent);
    this.dialogRef.instance.mode = 'edit';
    this.dialogRef.instance.user = this.user;
    this.dialogRef.instance.onClose = () => this.closeDialog();
    this.dialogRef.instance.onSuccess = (updatedUser) => {
      console.log('User updated:', updatedUser);
      // Reload user details
      this.loadUserDetail(this.user!.id);
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
   * Confirm and deactivate user
   */
  confirmDeactivate(): void {
    if (!this.user) return;

    const confirmed = confirm(
      `Are you sure you want to deactivate ${this.user.username}?\n\nThis will:\n- Revoke all active sessions\n- Prevent login\n- Preserve all data and history`
    );

    if (confirmed) {
      this.deactivateUser();
    }
  }

  /**
   * Deactivate user
   */
  deactivateUser(): void {
    if (!this.user) return;

    this.userService.deactivateUser(this.user.id).subscribe({
      next: () => {
        // Reload user details
        this.loadUserDetail(this.user!.id);
      },
      error: (error) => {
        alert(error.message || 'Failed to deactivate user');
      },
    });
  }

  /**
   * Activate user
   */
  activateUser(): void {
    if (!this.user) return;

    this.userService.activateUser(this.user.id).subscribe({
      next: () => {
        // Reload user details
        this.loadUserDetail(this.user!.id);
      },
      error: (error) => {
        alert(error.message || 'Failed to activate user');
      },
    });
  }

  /**
   * Navigate to project
   */
  navigateToProject(projectId: string): void {
    // TODO: Navigate to project detail page when implemented
    console.log('Navigate to project:', projectId);
  }

  /**
   * Go back to user list
   */
  goBack(): void {
    this.location.back();
  }

  /**
   * Check if current user can edit this user
   */
  canEdit(): boolean {
    if (!this.currentUser || !this.user) return false;

    const role = this.currentUser.role?.toLowerCase();
    const isSelf = this.currentUser.id === this.user.id;

    // Admins can edit anyone, users can edit themselves
    return role === 'superadmin' || role === 'admin' || isSelf;
  }

  /**
   * Check if current user can deactivate this user
   */
  canDeactivate(): boolean {
    if (!this.currentUser || !this.user) return false;

    const role = this.currentUser.role?.toLowerCase();
    const isSelf = this.currentUser.id === this.user.id;

    // Only superadmin can deactivate, but not themselves
    return role === 'superadmin' && !isSelf;
  }

  /**
   * Check if current user can activate this user
   */
  canActivate(): boolean {
    if (!this.currentUser || !this.user) return false;

    const role = this.currentUser.role?.toLowerCase();

    // Superadmin and admin can activate
    return role === 'superadmin' || role === 'admin';
  }

  /**
   * Get user initials for avatar
   */
  getUserInitials(): string {
    if (!this.user) return 'U';

    if (this.user.firstName && this.user.lastName) {
      return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
    }

    return (this.user.username || 'U')[0].toUpperCase();
  }

  /**
   * Get full name or username
   */
  getDisplayName(): string {
    if (!this.user) return '';

    if (this.user.firstName && this.user.lastName) {
      return `${this.user.firstName} ${this.user.lastName}`;
    }

    return this.user.username;
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(): string {
    const role = this.user?.role?.toLowerCase() || '';
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
   * Get status badge class
   */
  getStatusBadgeClass(): string {
    return this.user?.isActive ? 'status-active' : 'status-inactive';
  }

  /**
   * Format date
   */
  formatDate(date?: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  /**
   * Format date (short)
   */
  formatDateShort(date?: string): string {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Retry loading user
   */
  retry(): void {
    const userId = this.route.snapshot.paramMap.get('id');
    if (userId) {
      this.loadUserDetail(userId);
    }
  }
}
