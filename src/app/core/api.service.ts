import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  Consulta, ConsultaRequest, ErroValidacao, Gestante, GestanteRequest, GestanteUpdate,
  Medico, MedicoRequest, Page, PlanoPartoRequest, PlanoPartoResponse, ResumoDashboard, StatusConsulta,
} from './models';

const BASE = '/api/v1';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  // Dashboard
  resumo() { return this.http.get<ResumoDashboard>(`${BASE}/dashboard`); }

  // Gestantes
  gestantes() { return this.http.get<Gestante[]>(`${BASE}/gestantes`); }
  cadastrarGestante(body: GestanteRequest) { return this.http.post<Gestante>(`${BASE}/gestantes`, body); }
  atualizarGestante(id: string, body: GestanteUpdate) { return this.http.put<Gestante>(`${BASE}/gestantes/${id}`, body); }
  inativarGestante(id: string) { return this.http.delete<void>(`${BASE}/gestantes/${id}`); }

  // Médicos
  medicos() { return this.http.get<Medico[]>(`${BASE}/medicos`); }
  cadastrarMedico(body: MedicoRequest) { return this.http.post<Medico>(`${BASE}/medicos`, body); }
  inativarMedico(id: string) { return this.http.delete<void>(`${BASE}/medicos/${id}`); }

  // Consultas
  consultas(filtro: { status?: StatusConsulta | ''; medicoId?: string; page?: number; size?: number } = {}) {
    let params = new HttpParams()
      .set('page', filtro.page ?? 0)
      .set('size', filtro.size ?? 20)
      .set('sort', 'dataHora,asc');
    if (filtro.status) params = params.set('status', filtro.status);
    if (filtro.medicoId) params = params.set('medicoId', filtro.medicoId);
    return this.http.get<Page<Consulta>>(`${BASE}/consultas`, { params });
  }
  agendar(body: ConsultaRequest) { return this.http.post<Consulta>(`${BASE}/consultas`, body); }
  cancelar(id: string, motivo: string) { return this.http.patch<Consulta>(`${BASE}/consultas/${id}/cancelar`, { motivo }); }
  finalizar(id: string, prontuario: string) { return this.http.patch<Consulta>(`${BASE}/consultas/${id}/finalizar`, { prontuario }); }

  // IA
  planoParto(body: PlanoPartoRequest) { return this.http.post<PlanoPartoResponse>(`${BASE}/ia/plano-parto`, body); }
}

/** Transforma qualquer erro da API numa mensagem legível em português. */
export function mensagemDeErro(err: unknown): string {
  if (!(err instanceof HttpErrorResponse)) return 'Algo deu errado. Tente de novo.';
  if (err.status === 0) return 'Não foi possível falar com a API. Ela está rodando na porta 8081?';
  const body = err.error;
  if (Array.isArray(body)) return (body as ErroValidacao[]).map(e => e.mensagem).join(' · ');
  if (typeof body === 'string' && body.trim()) return body;
  if (body?.message) return body.message;
  if (body?.mensagem) return body.mensagem;
  if (err.status === 403) return 'Sem permissão para esta ação.';
  if (err.status === 404) return 'Registro não encontrado.';
  return `Erro ${err.status} ao processar a requisição.`;
}
