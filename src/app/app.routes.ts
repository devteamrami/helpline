import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Public routes (no layout)
  {
    path: 'auth/login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/login/login.component').then(
        (m) => m.LoginComponent
      ),
  },
  // Protected routes (with main layout)
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component').then(
        (m) => m.MainLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/user-list/user-list.component').then(
            (m) => m.UserListComponent
          ),
      },
      {
        path: 'users/:id',
        loadComponent: () =>
          import('./features/users/user-detail/user-detail.component').then(
            (m) => m.UserDetailComponent
          ),
      },
      {
        path: 'projects',
        loadComponent: () =>
          import('./features/projects/project-list/project-list.component').then(
            (m) => m.ProjectListComponent
          ),
      },
      {
        path: 'projects/:id',
        loadComponent: () =>
          import('./features/projects/project-detail/project-detail.component').then(
            (m) => m.ProjectDetailComponent
          ),
      },
      {
        path: 'projects/:projectId/tasks/:taskId',
        loadComponent: () =>
          import('./features/tasks/task-detail/task-detail.component').then(
            (m) => m.TaskDetailComponent
          ),
      },
      {
        path: 'tickets',
        canActivate: [authGuard, roleGuard(['admin', 'superadmin', 'manager'])],
        loadComponent: () =>
          import('./features/tickets/ticket-list/ticket-list.component').then(
            (m) => m.TicketListComponent
          ),
      },
      {
        path: 'tickets/:id',
        canActivate: [authGuard, roleGuard(['admin', 'superadmin', 'manager'])],
        loadComponent: () =>
          import('./features/tickets/ticket-detail/ticket-detail.component').then(
            (m) => m.TicketDetailComponent
          ),
      },
      {
        path: 'faqs',
        canActivate: [authGuard, roleGuard(['admin', 'superadmin'])],
        loadComponent: () =>
          import('./features/tickets/faq/faq.component').then(
            (m) => m.FaqComponent
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  // Wildcard must be last - but should preserve the URL structure
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
