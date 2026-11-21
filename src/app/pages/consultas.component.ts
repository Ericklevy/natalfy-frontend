import { DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnInit, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensagemDeErro } from '../core/api.service';
import { Consulta, Gestante, Medico, StatusConsulta } from '../core/models';

type Acao = { tipo: 'agendar' } | { tipo: 'cancelar' | 'finalizar'; consulta: Consulta };

@Component({
  selector: 'app-consultas',
  imports: [FormsModule, DatePipe, TitleCasePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>Consultas</h1>
        <p>{{ total() }} {{ total() === 1 ? 'consulta' : 'consultas' }} {{ filtro() ? 'com status ' + (filtro() | titlecase) : 'no total' }}</p>
      </div>
      <button class="btn primary" (click)="abrir({ tipo: 'agendar' })">+ Agendar consulta</button>
    </div>

    <div class="chips" role="tablist" aria-label="Filtrar por status">
      @for (s of status; track s.valor) {
        <button role="tab" [attr.aria-selected]="filtro() === s.valor" [class.on]="filtro() === s.valor" (click)="filtrar(s.valor)">{{ s.label }}</button>
      }
    </div>

    @if (erro()) { <div class="alert error">{{ erro() }}</div> }

    <section class="card">
      @if (carregando()) {
        @for (i of [1,2,3,4]; track i) { <div class="skeleton row-sk"></div> }
      } @else if (consultas().length === 0) {
        <div class="empty"><strong>Nada por aqui</strong>Nenhuma consulta encontrada com esse filtro.</div>
      } @else {
        <table class="list">
          <thead><tr><th>Data</th><th>Gestante</th><th>Médico</th><th>Status</th><th></th></tr></thead>
          <tbody>
            @for (c of consultas(); track c.id) {
              <tr>
                <td><strong>{{ c.dataHora | date: 'dd/MM/yyyy' }}</strong><span class="sub">{{ c.dataHora | date: 'HH:mm' }}</span></td>
                <td data-label="Gestante">{{ c.nomeGestante }}</td>
                <td data-label="Médico">{{ c.nomeMedico }}</td>
                <td><span class="badge" [class]="c.status">{{ c.status | titlecase }}</span></td>
                <td class="actions">
                  @if (c.status === 'AGENDADA') {
                    <button class="btn sm" (click)="abrir({ tipo: 'finalizar', consulta: c })">Finalizar</button>
                    <button class="btn sm danger" (click)="abrir({ tipo: 'cancelar', consulta: c })">Cancelar</button>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
        @if (paginas() > 1) {
          <div class="pager">
            <button class="btn sm" [disabled]="pagina() === 0" (click)="irPara(pagina() - 1)">Anterior</button>
            <span>Página {{ pagina() + 1 }} de {{ paginas() }}</span>
            <button class="btn sm" [disabled]="pagina() + 1 >= paginas()" (click)="irPara(pagina() + 1)">Próxima</button>
          </div>
        }
      }
    </section>

    @if (acao(); as a) {
      <div class="backdrop" (click)="fechar()">
        <form class="dialog form" (click)="$event.stopPropagation()" (ngSubmit)="confirmar()" #f="ngForm">
          @switch (a.tipo) {
            @case ('agendar') {
              <h2>Agendar consulta</h2>
              <p>A clínica atende de segunda a sábado, das 7h às 19h, com 30 minutos de antecedência.</p>
              <div class="field">
                <label for="g">Gestante</label>
                <select id="g" name="g" required [(ngModel)]="form.gestanteId">
                  <option value="" disabled>Selecione</option>
                  @for (g of gestantes(); track g.id) { <option [value]="g.id">{{ g.nome }}</option> }
                </select>
              </div>
              <div class="field">
                <label for="m">Médico</label>
                <select id="m" name="m" required [(ngModel)]="form.medicoId">
                  <option value="" disabled>Selecione</option>
                  @for (m of medicos(); track m.id) { <option [value]="m.id">{{ m.nome }} · {{ m.especialidade }}</option> }
                </select>
              </div>
              <div class="field">
                <label for="d">Data e hora</label>
                <input id="d" name="d" type="datetime-local" required [min]="agoraLocal" [(ngModel)]="form.dataHora" />
              </div>
            }
            @case ('cancelar') {
              <h2>Cancelar consulta</h2>
              <p>{{ a.consulta.nomeGestante }} com {{ a.consulta.nomeMedico }}, {{ a.consulta.dataHora | date: "dd/MM 'às' HH:mm" }}.</p>
              <div class="field">
                <label for="mo">Motivo</label>
                <textarea id="mo" name="mo" required [(ngModel)]="form.texto" placeholder="Ex.: a gestante teve um imprevisto"></textarea>
              </div>
            }
            @case ('finalizar') {
              <h2>Finalizar consulta</h2>
              <p>{{ a.consulta.nomeGestante }} com {{ a.consulta.nomeMedico }}. Registre as anotações do atendimento.</p>
              <div class="field">
                <label for="pr">Prontuário</label>
                <textarea id="pr" name="pr" required rows="6" [(ngModel)]="form.texto" placeholder="Queixas, exames, conduta…"></textarea>
              </div>
            }
          }
          @if (erroDialogo()) { <div class="alert error" role="alert">{{ erroDialogo() }}</div> }
          <div class="form-actions">
            <button class="btn ghost" type="button" (click)="fechar()">Voltar</button>
            <button class="btn" [class.primary]="a.tipo !== 'cancelar'" [class.danger]="a.tipo === 'cancelar'" type="submit" [disabled]="salvando() || f.invalid">
              {{ salvando() ? 'Salvando…' : rotulo[a.tipo] }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .chips { display: flex; gap: 8px; margin-bottom: 16px; overflow-x: auto; padding-bottom: 2px; }
    .chips button { border: 1px solid var(--line); background: var(--surface); border-radius: 999px; padding: 8px 16px; font-weight: 500; cursor: pointer; white-space: nowrap; }
    .chips button.on { background: var(--ink); border-color: var(--ink); color: #fff; }
    .row-sk { height: 52px; margin-bottom: 10px; }
    .pager { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 16px; color: var(--muted); font-size: 14px; }
  `],
})
export class ConsultasComponent implements OnInit {
  private api = inject(ApiService);
  /** ?nova=1 abre direto o formulário de agendamento (atalho do painel) */
  nova = input<string>();

  status: { valor: StatusConsulta | ''; label: string }[] = [
    { valor: '', label: 'Todas' },
    { valor: 'AGENDADA', label: 'Agendadas' },
    { valor: 'REALIZADA', label: 'Realizadas' },
    { valor: 'CANCELADA', label: 'Canceladas' },
  ];
  rotulo = { agendar: 'Agendar', cancelar: 'Cancelar consulta', finalizar: 'Finalizar' };

  consultas = signal<Consulta[]>([]);
  gestantes = signal<Gestante[]>([]);
  medicos = signal<Medico[]>([]);
  filtro = signal<StatusConsulta | ''>('');
  pagina = signal(0);
  paginas = signal(0);
  total = signal(0);
  carregando = signal(true);
  erro = signal('');

  acao = signal<Acao | null>(null);
  salvando = signal(false);
  erroDialogo = signal('');
  form = { gestanteId: '', medicoId: '', dataHora: '', texto: '' };
  agoraLocal = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  ngOnInit() {
    this.carregar();
    if (this.nova()) this.abrir({ tipo: 'agendar' });
  }

  carregar() {
    this.carregando.set(true);
    this.api.consultas({ status: this.filtro(), page: this.pagina() }).subscribe({
      next: p => {
        this.consultas.set(p.content);
        this.total.set(p.totalElements);
        this.paginas.set(p.totalPages);
        this.carregando.set(false);
        this.erro.set('');
      },
      error: e => { this.erro.set(mensagemDeErro(e)); this.carregando.set(false); },
    });
  }

  filtrar(s: StatusConsulta | '') { this.filtro.set(s); this.pagina.set(0); this.carregar(); }
  irPara(p: number) { this.pagina.set(p); this.carregar(); }

  abrir(a: Acao) {
    this.form = { gestanteId: '', medicoId: '', dataHora: '', texto: '' };
    this.erroDialogo.set('');
    this.acao.set(a);
    if (a.tipo === 'agendar' && !this.gestantes().length) {
      this.api.gestantes().subscribe(g => this.gestantes.set(g));
      this.api.medicos().subscribe(m => this.medicos.set(m));
    }
  }

  fechar() { if (!this.salvando()) this.acao.set(null); }

  confirmar() {
    const a = this.acao();
    if (!a) return;
    this.salvando.set(true);
    this.erroDialogo.set('');
    const req =
      a.tipo === 'agendar'
        ? this.api.agendar({ gestanteId: this.form.gestanteId, medicoId: this.form.medicoId, dataHora: this.form.dataHora + ':00' })
        : a.tipo === 'cancelar'
          ? this.api.cancelar(a.consulta.id, this.form.texto)
          : this.api.finalizar(a.consulta.id, this.form.texto);
    req.subscribe({
      next: () => { this.salvando.set(false); this.acao.set(null); this.carregar(); },
      error: e => { this.salvando.set(false); this.erroDialogo.set(mensagemDeErro(e)); },
    });
  }
}
