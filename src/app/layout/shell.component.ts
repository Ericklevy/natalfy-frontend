import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth';

interface Item { path: string; label: string; icon: string; }

// Ícones em SVG inline (traço), para não depender de biblioteca externa
const I = {
  painel: 'M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z',
  consultas: 'M7 2v3M17 2v3M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z',
  gestantes: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-7 9a7 7 0 0 1 14 0',
  medicos: 'M9 3h6v4H9zM5 7h14v14H5zM12 11v6M9 14h6',
  plano: 'M12 3l1.9 4.6L19 9l-4 3.4 1.2 5.1L12 15l-4.2 2.5L9 12.4 5 9l5.1-1.4z',
};

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="side">
        <a class="brand" routerLink="/painel">
          <span class="mark">N</span>
          <span class="name">Natalfy</span>
        </a>
        <nav>
          @for (it of itens; track it.path) {
            <a [routerLink]="it.path" routerLinkActive="on" class="nav-item">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path [attr.d]="it.icon" /></svg>
              <span>{{ it.label }}</span>
            </a>
          }
        </nav>
        <div class="me">
          <span class="avatar">{{ inicial() }}</span>
          <span class="who" [title]="auth.usuario()">{{ auth.usuario() }}</span>
          <button class="btn ghost sm" (click)="auth.sair()">Sair</button>
        </div>
      </aside>

      <header class="mobile-top">
        <a class="brand" routerLink="/painel"><span class="mark">N</span><span class="name">Natalfy</span></a>
        <button class="btn ghost sm" (click)="auth.sair()">Sair</button>
      </header>

      <main class="main"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: 248px 1fr; min-height: 100dvh; }
    .side { position: sticky; top: 0; height: 100dvh; display: flex; flex-direction: column; gap: 28px; padding: 24px 16px; background: var(--surface); border-right: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--ink); padding: 0 8px; }
    .mark { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; background: var(--rose); color: #fff; font-family: var(--f-display); font-weight: 700; font-size: 19px; }
    .name { font-family: var(--f-display); font-weight: 700; font-size: 22px; }
    nav { display: grid; gap: 4px; }
    .nav-item { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; text-decoration: none; color: var(--muted); font-weight: 500; transition: background .15s, color .15s; }
    .nav-item svg { width: 20px; height: 20px; fill: none; stroke: currentColor; stroke-width: 1.7; stroke-linecap: round; stroke-linejoin: round; flex: none; }
    .nav-item:hover { background: var(--surface-2); color: var(--ink); }
    .nav-item.on { background: var(--rose-soft); color: var(--rose-ink); font-weight: 600; }
    .me { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px 8px 0; border-top: 1px solid var(--line); min-width: 0; }
    .avatar { display: grid; place-items: center; width: 32px; height: 32px; border-radius: 50%; background: var(--surface-2); font-weight: 600; flex: none; }
    .who { font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; min-width: 0; }
    .main { padding: 32px clamp(16px, 4vw, 48px) 48px; max-width: 1200px; width: 100%; min-width: 0; }
    .mobile-top { display: none; }

    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .mobile-top { display: flex; justify-content: space-between; align-items: center; position: sticky; top: 0; z-index: 20; padding: 12px 16px; padding-top: calc(12px + env(safe-area-inset-top)); background: color-mix(in srgb, var(--bg) 90%, transparent); backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
      .mobile-top .brand { padding: 0; }
      .side { position: fixed; top: auto; left: 0; right: 0; bottom: 0; width: 100%; height: auto; z-index: 30; flex-direction: row; padding: 6px 6px calc(6px + env(safe-area-inset-bottom)); border-right: none; border-top: 1px solid var(--line); box-shadow: 0 -8px 24px -12px rgba(42,31,34,.2); }
      .side > .brand, .me { display: none; }
      nav { grid-auto-flow: column; grid-auto-columns: 1fr; width: 100%; gap: 2px; }
      .nav-item { flex-direction: column; gap: 3px; padding: 8px 2px; font-size: 11px; justify-content: center; text-align: center; }
      .main { padding: 20px 16px calc(96px + env(safe-area-inset-bottom)); }
    }
  `],
})
export class ShellComponent {
  auth = inject(AuthService);
  itens: Item[] = [
    { path: '/painel', label: 'Painel', icon: I.painel },
    { path: '/consultas', label: 'Consultas', icon: I.consultas },
    { path: '/gestantes', label: 'Gestantes', icon: I.gestantes },
    { path: '/medicos', label: 'Médicos', icon: I.medicos },
    { path: '/plano-de-parto', label: 'Plano de parto', icon: I.plano },
  ];
  inicial = () => (this.auth.usuario()[0] ?? '?').toUpperCase();
}
