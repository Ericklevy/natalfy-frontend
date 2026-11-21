import { DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensagemDeErro } from '../core/api.service';
import { Gestante, PlanoPartoResponse } from '../core/models';

@Component({
  selector: 'app-plano-parto',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>Plano de parto</h1>
        <p>Uma sugestão inicial gerada por IA (Google Gemini) para a equipe revisar com a gestante.</p>
      </div>
    </div>

    <div class="layout">
      <form class="card form" (ngSubmit)="gerar()" #f="ngForm">
        <div class="field">
          <label for="g">Gestante</label>
          <input id="g" name="g" required list="lista-gestantes" placeholder="Digite ou escolha um nome" [(ngModel)]="form.nomeGestante" />
          <datalist id="lista-gestantes">@for (g of gestantes(); track g.id) { <option [value]="g.nome"></option> }</datalist>
        </div>
        <div class="field">
          <label for="c">Condições médicas</label>
          <textarea id="c" name="c" required [(ngModel)]="form.condicoesMedicas" placeholder="Ex.: diabetes gestacional controlada, 34 semanas"></textarea>
        </div>
        <div class="field">
          <label for="p">Preferências da gestante</label>
          <textarea id="p" name="p" [(ngModel)]="form.preferencias" placeholder="Ex.: parto normal, acompanhante, música ambiente"></textarea>
        </div>
        @if (erro()) { <div class="alert error" role="alert">{{ erro() }}</div> }
        <button class="btn primary" type="submit" [disabled]="gerando() || f.invalid">
          {{ gerando() ? 'Gerando plano…' : '✦ Gerar plano' }}
        </button>
      </form>

      <section class="card result" aria-live="polite">
        @if (gerando()) {
          <div class="skeleton" style="height:22px;width:60%"></div>
          @for (i of [1,2,3,4,5]; track i) { <div class="skeleton" style="height:14px;margin-top:12px"></div> }
        } @else if (plano()) {
          @let p = plano()!;
          <span class="tag">{{ p.statusClinico }}</span>
          <h2>Plano de {{ p.nomeGestante }}</h2>
          <p class="gen">Gerado em {{ p.geradoEm | date: "dd/MM/yyyy 'às' HH:mm" }}</p>
          <div class="texto">{{ p.planoGerado }}</div>
          <p class="aviso">Sugestão automática. Não substitui a avaliação da equipe médica.</p>
        } @else {
          <div class="empty">
            <span class="star">✦</span>
            <strong>O plano aparece aqui</strong>
            Preencha os dados ao lado e clique em gerar.
          </div>
        }
      </section>
    </div>
  `,
  styles: [`
    .layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr); gap: 16px; align-items: start; }
    .layout .card + .card { margin-top: 0; }
    .result { min-height: 320px; }
    .tag { display: inline-block; padding: 3px 10px; border-radius: 999px; background: var(--rose-soft); color: var(--rose-ink); font-size: 12.5px; font-weight: 600; }
    .result h2 { margin: 10px 0 2px; font-size: 24px; }
    .gen { margin: 0 0 16px; color: var(--muted); font-size: 13px; }
    .texto { white-space: pre-wrap; line-height: 1.7; }
    .aviso { margin: 18px 0 0; padding-top: 12px; border-top: 1px solid var(--line); font-size: 12.5px; color: var(--muted); }
    .star { display: block; font-size: 32px; color: var(--rose); margin-bottom: 8px; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `],
})
export class PlanoPartoComponent implements OnInit {
  private api = inject(ApiService);

  gestantes = signal<Gestante[]>([]);
  plano = signal<PlanoPartoResponse | null>(null);
  gerando = signal(false);
  erro = signal('');
  form = { nomeGestante: '', condicoesMedicas: '', preferencias: '' };

  ngOnInit() { this.api.gestantes().subscribe({ next: g => this.gestantes.set(g), error: () => {} }); }

  gerar() {
    this.gerando.set(true);
    this.erro.set('');
    this.api.planoParto(this.form).subscribe({
      next: p => { this.plano.set(p); this.gerando.set(false); },
      error: e => { this.erro.set(mensagemDeErro(e)); this.gerando.set(false); },
    });
  }
}
