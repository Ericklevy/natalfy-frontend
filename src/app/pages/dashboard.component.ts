import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiService, mensagemDeErro } from '../core/api.service';
import { Consulta, ResumoDashboard } from '../core/models';
import { AuthService } from '../core/auth';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, DatePipe, TitleCasePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>{{ saudacao() }}</h1>
        <p>{{ hoje | date: "EEEE, d 'de' MMMM" }}</p>
      </div>
      <a class="btn primary" routerLink="/consultas" [queryParams]="{ nova: 1 }">+ Agendar consulta</a>
    </div>

    @if (erro()) { <div class="alert error">{{ erro() }}</div> }

    <div class="kpis">
      @for (k of kpis(); track k.label) {
        <a class="kpi card" [routerLink]="k.link">
          <span class="lbl">{{ k.label }}</span>
          @if (carregando()) { <span class="skeleton num-sk"></span> }
          @else { <b>{{ k.valor }}</b> }
          <span class="tone" [class]="k.tom"></span>
        </a>
      }
    </div>

    <section class="card">
      <div class="sec">
        <h2>Próximas consultas</h2>
        <a routerLink="/consultas">Ver agenda</a>
      </div>
      @if (carregando()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton row-sk"></div> }
      } @else if (proximas().length === 0) {
        <div class="empty"><strong>Agenda livre</strong>Nenhuma consulta agendada por enquanto.</div>
      } @else {
        <ul class="next">
          @for (c of proximas(); track c.id) {
            <li>
              <div class="when"><b>{{ c.dataHora | date: 'dd' }}</b><span>{{ c.dataHora | date: 'MMM' }}</span></div>
              <div class="who">
                <strong>{{ c.nomeGestante }}</strong>
                <span>{{ c.nomeMedico }} · {{ c.dataHora | date: 'HH:mm' }}</span>
              </div>
              <span class="badge" [class]="c.status">{{ c.status | titlecase }}</span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .kpis { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px; margin-bottom: 16px; }
    .kpi { position: relative; overflow: hidden; display: grid; gap: 6px; text-decoration: none; color: var(--ink); transition: transform .2s, box-shadow .2s; }
    .kpi:hover { transform: translateY(-2px); }
    .kpi .lbl { color: var(--muted); font-size: 13.5px; font-weight: 500; }
    .kpi b { font-family: var(--f-display); font-size: 44px; line-height: 1; font-variant-numeric: tabular-nums; }
    .num-sk { height: 44px; width: 64px; }
    .tone { position: absolute; right: -24px; top: -24px; width: 96px; height: 96px; border-radius: 50%; opacity: .5; }
    .tone.rose { background: var(--rose-soft); } .tone.sage { background: var(--sage-soft); } .tone.amber { background: var(--amber-soft); }
    .sec { display: flex; justify-content: space-between; align-items: baseline; }
    .sec a { font-size: 14px; font-weight: 600; }
    .row-sk { height: 56px; margin-top: 10px; }
    .next { list-style: none; margin: 0; padding: 0; }
    .next li { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px solid var(--line); }
    .next li:first-child { border-top: none; }
    .when { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 12px; background: var(--rose-soft); color: var(--rose-ink); flex: none; line-height: 1.1; }
    .when b { font-family: var(--f-display); font-size: 20px; }
    .when span { font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
    .who { flex: 1; min-width: 0; display: grid; }
    .who strong, .who span { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .who span { color: var(--muted); font-size: 13.5px; }
    @media (max-width: 720px) {
      .kpis { grid-template-columns: 1fr 1fr; gap: 10px; }
      .kpis .kpi:first-child { grid-column: 1 / -1; }
      .kpi b { font-size: 36px; }
      .next .badge { display: none; }
    }
  `],
})
export class DashboardComponent implements OnInit {
  private api = inject(ApiService);
  private auth = inject(AuthService);

  hoje = new Date();
  carregando = signal(true);
  erro = signal('');
  resumo = signal<ResumoDashboard | null>(null);
  proximas = signal<Consulta[]>([]);

  saudacao = computed(() => {
    const h = this.hoje.getHours();
    const nome = this.auth.usuario().split('@')[0];
    return `${h < 12 ? 'Bom dia' : h < 18 ? 'Boa tarde' : 'Boa noite'}${nome ? ', ' + nome : ''}`;
  });

  kpis = computed(() => {
    const r = this.resumo();
    return [
      { label: 'Consultas hoje', valor: r?.totalConsultasHoje ?? 0, link: '/consultas', tom: 'rose' },
      { label: 'Gestantes acompanhadas', valor: r?.totalGestantes ?? 0, link: '/gestantes', tom: 'sage' },
      { label: 'Médicos ativos', valor: r?.medicosAtivos ?? 0, link: '/medicos', tom: 'amber' },
    ];
  });

  ngOnInit() {
    forkJoin({ resumo: this.api.resumo(), consultas: this.api.consultas({ status: 'AGENDADA', size: 5 }) }).subscribe({
      next: ({ resumo, consultas }) => {
        this.resumo.set(resumo);
        this.proximas.set(consultas.content);
        this.carregando.set(false);
      },
      error: e => { this.erro.set(mensagemDeErro(e)); this.carregando.set(false); },
    });
  }
}
