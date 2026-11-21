import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GestantesComponent } from './gestantes.component';

describe('GestantesComponent', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [GestantesComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
  });

  it('formata o CPF enquanto a pessoa digita', () => {
    const c = TestBed.createComponent(GestantesComponent).componentInstance;
    expect(c.mascaraCpf('12345678909')).toBe('123.456.789-09');
    expect(c.mascaraCpf('1234')).toBe('123.4');
  });

  it('lista e filtra as gestantes vindas da API', () => {
    const f = TestBed.createComponent(GestantesComponent);
    f.detectChanges();
    http.expectOne('/api/v1/gestantes').flush([
      { id: '1', nome: 'Ana Souza', email: 'ana@email.com', dataCadastro: '2026-01-10' },
      { id: '2', nome: 'Mariana Lima', email: 'mari@email.com', dataCadastro: '2026-02-10' },
    ]);
    const c = f.componentInstance;
    expect(c.filtradas().length).toBe(2);
    c.busca.set('mari');
    expect(c.filtradas().map(g => g.nome)).toEqual(['Mariana Lima']);
  });
});
