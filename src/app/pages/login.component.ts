import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth';
import { mensagemDeErro } from '../core/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule],
  template: `
    <div class="wrap">
      <section class="hero">
        <span class="mark">N</span>
        <h1>Cuidado contínuo, do pré-natal ao parto.</h1>
        <p>Gestantes, médicos e consultas da clínica num só lugar.</p>
        <ul>
          <li>Agenda com regras de horário e antecedência</li>
          <li>Prontuário ao finalizar cada consulta</li>
          <li>Plano de parto sugerido por IA</li>
        </ul>
      </section>

      <section class="panel">
        <form class="card form" (ngSubmit)="enviar()" #f="ngForm">
          <div>
            <h2>{{ modo() === 'entrar' ? 'Entrar' : 'Criar acesso' }}</h2>
            <p class="hint">{{ modo() === 'entrar' ? 'Use o e-mail cadastrado na clínica.' : 'Cadastre um usuário para testar o sistema.' }}</p>
          </div>

          @if (erro()) { <div class="alert error" role="alert">{{ erro() }}</div> }
          @if (ok()) { <div class="alert ok" role="status">{{ ok() }}</div> }

          <div class="field">
            <label for="login">E-mail</label>
            <input id="login" name="login" type="email" autocomplete="username" required [(ngModel)]="login" />
          </div>
          <div class="field">
            <label for="senha">Senha</label>
            <input id="senha" name="senha" type="password" [autocomplete]="modo() === 'entrar' ? 'current-password' : 'new-password'" required [(ngModel)]="senha" />
          </div>
          @if (modo() === 'criar') {
            <div class="field">
              <label for="role">Perfil</label>
              <select id="role" name="role" [(ngModel)]="role">
                <option value="USER">Recepção</option>
                <option value="ADMIN">Administração</option>
              </select>
            </div>
          }

          <button class="btn primary" type="submit" [disabled]="carregando() || f.invalid">
            {{ carregando() ? 'Aguarde…' : (modo() === 'entrar' ? 'Entrar' : 'Criar acesso') }}
          </button>
          <button class="btn ghost" type="button" (click)="alternar()">
            {{ modo() === 'entrar' ? 'Ainda não tem acesso? Criar' : 'Já tenho acesso' }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: [`
    .wrap { min-height: 100dvh; display: grid; grid-template-columns: 1.1fr 1fr; }
    .hero { background: linear-gradient(160deg, #b0546b, #7c3149); color: #fff; padding: clamp(32px, 6vw, 80px); display: flex; flex-direction: column; justify-content: center; gap: 18px; }
    .hero .mark { display: grid; place-items: center; width: 52px; height: 52px; border-radius: 16px; background: rgba(255,255,255,.16); font-family: var(--f-display); font-weight: 700; font-size: 26px; }
    .hero h1 { font-size: clamp(30px, 4.2vw, 52px); line-height: 1.05; max-width: 14em; }
    .hero p { margin: 0; font-size: 18px; color: rgba(255,255,255,.85); }
    .hero ul { margin: 8px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
    .hero li { padding-left: 26px; position: relative; color: rgba(255,255,255,.92); }
    .hero li::before { content: '✓'; position: absolute; left: 0; font-weight: 700; }
    .panel { display: grid; place-items: center; padding: 24px; }
    .panel .card { width: 100%; max-width: 400px; padding: 28px; }
    .panel h2 { font-size: 26px; margin: 0; }
    .hint { margin: 4px 0 0; color: var(--muted); }
    @media (max-width: 820px) {
      .wrap { grid-template-columns: 1fr; }
      .hero { padding: 40px 20px 28px; padding-top: calc(40px + env(safe-area-inset-top)); }
      .hero ul { display: none; }
      .panel { place-items: start center; padding: 20px 16px 40px; }
    }
  `],
})
export class LoginComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  modo = signal<'entrar' | 'criar'>('entrar');
  carregando = signal(false);
  erro = signal('');
  ok = signal('');
  login = '';
  senha = '';
  role: 'USER' | 'ADMIN' = 'USER';

  alternar() {
    this.modo.update(m => (m === 'entrar' ? 'criar' : 'entrar'));
    this.erro.set(''); this.ok.set('');
  }

  enviar() {
    this.erro.set(''); this.ok.set('');
    this.carregando.set(true);
    if (this.modo() === 'criar') {
      this.auth.registrar(this.login, this.senha, this.role).subscribe({
        next: () => { this.carregando.set(false); this.ok.set('Acesso criado. Agora é só entrar.'); this.modo.set('entrar'); },
        error: e => { this.carregando.set(false); this.erro.set(mensagemDeErro(e)); },
      });
      return;
    }
    this.auth.login(this.login, this.senha).subscribe({
      next: () => this.router.navigate(['/painel']),
      error: e => {
        this.carregando.set(false);
        this.erro.set(e.status === 403 || e.status === 401 ? 'E-mail ou senha incorretos.' : mensagemDeErro(e));
      },
    });
  }
}
