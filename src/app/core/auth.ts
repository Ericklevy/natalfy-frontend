import { HttpClient, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, tap, throwError } from 'rxjs';

const KEY = 'natalfy.token';

function lerToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

/** Lê o payload do JWT sem validar a assinatura (isso é papel da API). */
function payload(token: string | null): { sub?: string; exp?: number; role?: string; roles?: string[] } {
  if (!token) return {};
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(decodeURIComponent(escape(atob(b64))));
  } catch { return {}; }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private _token = signal<string | null>(lerToken());

  readonly token = this._token.asReadonly();
  readonly usuario = computed(() => payload(this._token()).sub ?? '');
  readonly logado = computed(() => {
    const t = this._token();
    if (!t) return false;
    const exp = payload(t).exp;
    return !exp || exp * 1000 > Date.now();
  });

  login(login: string, password: string) {
    return this.http.post<{ token: string }>('/api/v1/auth/login', { login, password }).pipe(
      tap(({ token }) => {
        this._token.set(token);
        try { localStorage.setItem(KEY, token); } catch { /* modo privado */ }
      }),
    );
  }

  registrar(login: string, password: string, role: 'ADMIN' | 'USER') {
    return this.http.post('/api/v1/auth/register', { login, password, role }, { responseType: 'text' });
  }

  sair() {
    this._token.set(null);
    try { localStorage.removeItem(KEY); } catch { /* ignore */ }
    this.router.navigate(['/login']);
  }
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const autenticado = token && !req.url.includes('/auth/')
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;
  return next(autenticado).pipe(
    catchError(err => {
      // Token vencido ou inválido: volta para o login
      if ((err.status === 401 || err.status === 403) && token && !auth.logado()) auth.sair();
      return throwError(() => err);
    }),
  );
};

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.logado() ? true : inject(Router).createUrlTree(['/login']);
};
