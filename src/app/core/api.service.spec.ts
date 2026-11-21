import { HttpErrorResponse } from '@angular/common/http';
import { mensagemDeErro } from './api.service';

describe('mensagemDeErro', () => {
  const erro = (status: number, error: unknown) => new HttpErrorResponse({ status, error });

  it('junta as mensagens de validação da API', () => {
    const msg = mensagemDeErro(erro(400, [
      { campo: 'cpf', mensagem: 'O CPF informado é inválido' },
      { campo: 'email', mensagem: 'O formato do e-mail é inválido' },
    ]));
    expect(msg).toBe('O CPF informado é inválido · O formato do e-mail é inválido');
  });

  it('usa o texto puro quando a API responde com string', () => {
    expect(mensagemDeErro(erro(400, 'Este e-mail já está cadastrado no sistema.')))
      .toBe('Este e-mail já está cadastrado no sistema.');
  });

  it('explica quando a API está fora do ar', () => {
    expect(mensagemDeErro(erro(0, null))).toContain('8081');
  });

  it('traduz 403 sem corpo', () => {
    expect(mensagemDeErro(erro(403, null))).toBe('Sem permissão para esta ação.');
  });
});
