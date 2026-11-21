import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensagemDeErro } from '../core/api.service';
import { Medico } from '../core/models';

@Component({
  selector: 'app-medicos',
  imports: [FormsModule],
  template: `
    <div class="page-head">
      <div>
        <h1>Médicos</h1>
        <p>{{ medicos().length }} na equipe</p>
      </div>
      <button class="btn primary" (click)="novo()">+ Novo médico</button>
    </div>

    @if (erro()) { <div class="alert error">{{ erro() }}</div> }

    @if (carregando()) {
      <div class="grid">@for (i of [1,2,3]; track i) { <div class="skeleton card-sk"></div> }</div>
    } @else if (medicos().length === 0) {
      <div class="card empty"><strong>Equipe vazia</strong>Cadastre um médico para liberar o agendamento.</div>
    } @else {
      <div class="grid">
        @for (m of medicos(); track m.id) {
          <article class="card doc">
            <span class="avatar">{{ iniciais(m.nome) }}</span>
            <div class="info">
              <h3>{{ m.nome }}</h3>
              <span class="esp">{{ m.especialidade }}</span>
              <span class="meta">{{ m.crm }}</span>
              <a class="meta" [href]="'mailto:' + m.email">{{ m.email }}</a>
            </div>
            <button class="btn sm danger" (click)="inativar(m)" aria-label="Inativar médico">Inativar</button>
          </article>
        }
      </div>
    }

    @if (aberto()) {
      <div class="backdrop" (click)="fechar()">
        <form class="dialog form" (click)="$event.stopPropagation()" (ngSubmit)="salvar()" #f="ngForm">
          <h2>Novo médico</h2>
          <p>O CRM identifica o médico e não pode se repetir.</p>
          <div class="form-grid">
            <div class="field full"><label for="n">Nome completo</label><input id="n" name="n" required [(ngModel)]="form.nome" /></div>
            <div class="field"><label for="c">CRM</label><input id="c" name="c" required placeholder="CRM-DF 123456" [(ngModel)]="form.crm" /></div>
            <div class="field"><label for="es">Especialidade</label>
              <input id="es" name="es" required list="especialidades" [(ngModel)]="form.especialidade" />
              <datalist id="especialidades"><option value="Obstetrícia"></option><option value="Ginecologia e Obstetrícia"></option><option value="Medicina Fetal"></option><option value="Pediatria"></option><option value="Neonatologia"></option></datalist>
            </div>
            <div class="field"><label for="e">E-mail</label><input id="e" name="e" type="email" required [(ngModel)]="form.email" /></div>
            <div class="field"><label for="t">Telefone</label><input id="t" name="t" type="tel" inputmode="tel" [(ngModel)]="form.telefone" /></div>
          </div>
          @if (erroDialogo()) { <div class="alert error" role="alert">{{ erroDialogo() }}</div> }
          <div class="form-actions">
            <button class="btn ghost" type="button" (click)="fechar()">Voltar</button>
            <button class="btn primary" type="submit" [disabled]="salvando() || f.invalid">{{ salvando() ? 'Salvando…' : 'Cadastrar' }}</button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .grid .card + .card { margin-top: 0; }
    .card-sk { height: 150px; border-radius: var(--radius); }
    .doc { display: grid; grid-template-columns: auto 1fr; gap: 14px; align-items: start; }
    .doc .btn { grid-column: 1 / -1; justify-self: start; }
    .avatar { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: var(--amber-soft); color: var(--amber); font-family: var(--f-display); font-weight: 700; font-size: 19px; }
    .info { display: grid; gap: 2px; min-width: 0; }
    .info h3 { font-size: 18px; }
    .esp { color: var(--rose-ink); font-weight: 600; font-size: 14px; }
    .meta { color: var(--muted); font-size: 13.5px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  `],
})
export class MedicosComponent implements OnInit {
  private api = inject(ApiService);

  medicos = signal<Medico[]>([]);
  carregando = signal(true);
  erro = signal('');
  aberto = signal(false);
  salvando = signal(false);
  erroDialogo = signal('');
  form = { nome: '', crm: '', especialidade: '', email: '', telefone: '' };

  ngOnInit() {
    this.api.medicos().subscribe({
      next: m => { this.medicos.set(m); this.carregando.set(false); },
      error: e => { this.erro.set(mensagemDeErro(e)); this.carregando.set(false); },
    });
  }

  iniciais(nome: string) {
    const p = nome.replace(/^(dr|dra)\.?\s+/i, '').split(/\s+/).filter(Boolean);
    return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
  }

  novo() {
    this.form = { nome: '', crm: '', especialidade: '', email: '', telefone: '' };
    this.erroDialogo.set('');
    this.aberto.set(true);
  }
  fechar() { if (!this.salvando()) this.aberto.set(false); }

  salvar() {
    this.salvando.set(true);
    this.api.cadastrarMedico(this.form).subscribe({
      next: m => { this.medicos.update(l => [...l, m]); this.salvando.set(false); this.aberto.set(false); },
      error: e => { this.salvando.set(false); this.erroDialogo.set(mensagemDeErro(e)); },
    });
  }

  inativar(m: Medico) {
    this.api.inativarMedico(m.id).subscribe({
      next: () => this.medicos.update(l => l.filter(x => x.id !== m.id)),
      error: e => this.erro.set(mensagemDeErro(e)),
    });
  }
}
