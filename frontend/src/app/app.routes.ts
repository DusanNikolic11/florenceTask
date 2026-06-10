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
  { path: '**', redirectTo: '' },
];
