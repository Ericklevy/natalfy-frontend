import { DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService, mensagemDeErro } from '../core/api.service';
import { Gestante } from '../core/models';

@Component({
  selector: 'app-gestantes',
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>Gestantes</h1>
        <p>{{ gestantes().length }} acompanhadas pela clínica</p>
      </div>
      <button class="btn primary" (click)="novo()">+ Nova gestante</button>
    </div>

    <div class="field search">
      <input type="search" placeholder="Buscar por nome ou e-mail" aria-label="Buscar gestante" [ngModel]="busca()" (ngModelChange)="busca.set($event)" />
    </div>

    @if (erro()) { <div class="alert error">{{ erro() }}</div> }

    <section class="card">
      @if (carregando()) {
        @for (i of [1,2,3]; track i) { <div class="skeleton row-sk"></div> }
      } @else if (filtradas().length === 0) {
        <div class="empty">
          <strong>{{ busca() ? 'Nenhum resultado' : 'Nenhuma gestante ainda' }}</strong>
          {{ busca() ? 'Tente outro nome ou e-mail.' : 'Cadastre a primeira para começar a agendar consultas.' }}
        </div>
      } @else {
        <table class="list">
          <thead><tr><th>Nome</th><th>E-mail</th><th>Cadastro</th><th></th></tr></thead>
          <tbody>
            @for (g of filtradas(); track g.id) {
              <tr>
                <td><span class="who"><span class="avatar">{{ g.nome[0] }}</span><strong>{{ g.nome }}</strong></span></td>
                <td data-label="E-mail">{{ g.email }}</td>
                <td data-label="Desde">{{ g.dataCadastro | date: 'dd/MM/yyyy' }}</td>
                <td class="actions"><button class="btn sm danger" (click)="inativar(g)">Inativar</button></td>
              </tr>
            }
          </tbody>
        </table>
      }
    </section>

    @if (aberto()) {
      <div class="backdrop" (click)="fechar()">
        <form class="dialog form" (click)="$event.stopPropagation()" (ngSubmit)="salvar()" #f="ngForm">
          <h2>Nova gestante</h2>
          <p>O CPF é validado pela API e não pode se repetir.</p>
          <div class="form-grid">
            <div class="field full"><label for="n">Nome completo</label><input id="n" name="n" required [(ngModel)]="form.nome" /></div>
            <div class="field"><label for="c">CPF</label><input id="c" name="c" required inputmode="numeric" placeholder="000.000.000-00" [(ngModel)]="form.cpf" (ngModelChange)="form.cpf = mascaraCpf($event)" maxlength="14" /></div>
            <div class="field"><label for="d">Nascimento</label><input id="d" name="d" type="date" required [max]="hoje" [(ngModel)]="form.dataNascimento" /></div>
            <div class="field"><label for="e">E-mail</label><input id="e" name="e" type="email" required [(ngModel)]="form.email" /></div>
            <div class="field"><label for="t">Telefone</label><input id="t" name="t" type="tel" inputmode="tel" placeholder="(61) 90000-0000" [(ngModel)]="form.telefone" /></div>
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
    .search { margin-bottom: 16px; max-width: 420px; }
    .row-sk { height: 52px; margin-bottom: 10px; }
    .who { display: flex; align-items: center; gap: 10px; }
    .avatar { display: grid; place-items: center; width: 34px; height: 34px; border-radius: 50%; background: var(--rose-soft); color: var(--rose-ink); font-weight: 700; flex: none; text-transform: uppercase; }
  `],
})
export class GestantesComponent implements OnInit {
  private api = inject(ApiService);

  gestantes = signal<Gestante[]>([]);
  busca = signal('');
  filtradas = computed(() => {
    const q = this.busca().trim().toLowerCase();
    return q ? this.gestantes().filter(g => (g.nome + ' ' + g.email).toLowerCase().includes(q)) : this.gestantes();
  });
  carregando = signal(true);
  erro = signal('');
  aberto = signal(false);
  salvando = signal(false);
  erroDialogo = signal('');
  hoje = new Date().toISOString().slice(0, 10);
  form = { nome: '', cpf: '', dataNascimento: '', email: '', telefone: '' };

  ngOnInit() { this.carregar(); }

  carregar() {
    this.api.gestantes().subscribe({
      next: g => { this.gestantes.set(g); this.carregando.set(false); },
      error: e => { this.erro.set(mensagemDeErro(e)); this.carregando.set(false); },
    });
  }

  mascaraCpf(v: string) {
    const d = (v ?? '').replace(/\D/g, '').slice(0, 11);
    return d.replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  novo() {
    this.form = { nome: '', cpf: '', dataNascimento: '', email: '', telefone: '' };
    this.erroDialogo.set('');
    this.aberto.set(true);
  }
  fechar() { if (!this.salvando()) this.aberto.set(false); }

  salvar() {
    this.salvando.set(true);
    this.api.cadastrarGestante(this.form).subscribe({
      next: g => { this.gestantes.update(l => [...l, g]); this.salvando.set(false); this.aberto.set(false); },
      error: e => { this.salvando.set(false); this.erroDialogo.set(mensagemDeErro(e)); },
    });
  }

  inativar(g: Gestante) {
    // A API só permite inativar para o perfil ADMIN
    this.api.inativarGestante(g.id).subscribe({
      next: () => this.gestantes.update(l => l.filter(x => x.id !== g.id)),
      error: e => this.erro.set(mensagemDeErro(e)),
    });
  }
}
