import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
    canActivate: [authGuard],
  },
  {
    path: 'documents/:id',
    loadComponent: () =>
      import('./pages/document-detail/document-detail.component').then(
        (m) => m.DocumentDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reports',
    loadComponent: () =>
      import('./pages/reports-list/reports-list.component').then((m) => m.ReportsListComponent),
    canActivate: [authGuard],
  },
  {
    path: 'reports/new',
    loadComponent: () =>
      import('./pages/report-form/report-form.component').then((m) => m.ReportFormComponent),
    canActivate: [authGuard],
  },
  {
    path: 'reports/:id',
    loadComponent: () =>
      import('./pages/report-detail/report-detail.component').then(
        (m) => m.ReportDetailComponent
      ),
    canActivate: [authGuard],
  },
  {
    path: 'reports/:id/edit',
    loadComponent: () =>
      import('./pages/report-form/report-form.component').then((m) => m.ReportFormComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
