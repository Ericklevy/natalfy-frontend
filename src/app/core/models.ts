// Tipos espelhados dos DTOs da natalfy-api (com.natalfy.application.dto)

export type StatusConsulta = 'AGENDADA' | 'CANCELADA' | 'REALIZADA';
export type UserRole = 'ADMIN' | 'USER';

export interface Gestante {
  id: string;
  nome: string;
  email: string;
  dataCadastro: string;
}

export interface GestanteRequest {
  nome: string;
  cpf: string;
  dataNascimento: string;
  email: string;
  telefone: string;
}

export interface GestanteUpdate {
  nome: string;
  dataNascimento: string;
  email: string;
  telefone: string;
}

export interface Medico {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
  email: string;
}

export interface MedicoRequest {
  nome: string;
  crm: string;
  especialidade: string;
  email: string;
  telefone: string;
}

export interface Consulta {
  id: string;
  medicoId: string;
  nomeMedico: string;
  gestanteId: string;
  nomeGestante: string;
  dataHora: string;
  status: StatusConsulta;
}

export interface ConsultaRequest {
  medicoId: string;
  gestanteId: string;
  dataHora: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ResumoDashboard {
  totalConsultasHoje: number;
  medicosAtivos: number;
  totalGestantes: number;
}

export interface PlanoPartoRequest {
  nomeGestante: string;
  condicoesMedicas: string;
  preferencias: string;
}

export interface PlanoPartoResponse {
  nomeGestante: string;
  statusClinico: string;
  planoGerado: string;
  geradoEm: string;
}

export interface ErroValidacao {
  campo: string;
  mensagem: string;
}
