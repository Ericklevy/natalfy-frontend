import { Routes } from '@angular/router';
import { authGuard } from './core/auth';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./pages/login.component').then(m => m.LoginComponent) },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'painel' },
      { path: 'painel', title: 'Painel · Natalfy', loadComponent: () => import('./pages/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'consultas', title: 'Consultas · Natalfy', loadComponent: () => import('./pages/consultas.component').then(m => m.ConsultasComponent) },
      { path: 'gestantes', title: 'Gestantes · Natalfy', loadComponent: () => import('./pages/gestantes.component').then(m => m.GestantesComponent) },
      { path: 'medicos', title: 'Médicos · Natalfy', loadComponent: () => import('./pages/medicos.component').then(m => m.MedicosComponent) },
      { path: 'plano-de-parto', title: 'Plano de parto · Natalfy', loadComponent: () => import('./pages/plano-parto.component').then(m => m.PlanoPartoComponent) },
    ],
  },
  { path: '**', redirectTo: '' },
];
