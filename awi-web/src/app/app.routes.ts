import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { adminGuard } from './auth/admin.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./admin-layout/admin-layout.component').then(
        (m) => m.AdminLayoutComponent
      ),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./admin-layout/dashboard.component').then(
            (m) => m.DashboardComponent
          ),
      },
      {
        path: 'orders',
        loadComponent: () =>
          import('./orders/orders-list.component').then(
            (m) => m.OrdersListComponent
          ),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/users-list.component').then(
            (m) => m.UsersListComponent
          ),
      },
      {
        path: 'users/new',
        loadComponent: () =>
          import('./users/user-form.component').then(
            (m) => m.UserFormComponent
          ),
      },
      {
        path: 'users/:id/edit',
        loadComponent: () =>
          import('./users/user-form.component').then(
            (m) => m.UserFormComponent
          ),
      },
      {
        path: 'site',
        loadComponent: () =>
          import('./site-content/site-content-editor.component').then(
            (m) => m.SiteContentEditorComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'audit',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./audit/audit-log.component').then(
            (m) => m.AuditLogComponent
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];