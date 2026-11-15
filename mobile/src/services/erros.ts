import type { CodigoErro } from '@/types/api';

/** Mensagens que dizem o que fazer, sem códigos técnicos (RN-GER-11). */
const MENSAGENS: Record<CodigoErro, string> = {
  USUARIO_NAO_CADASTRADO: 'Sua conta não foi encontrada. Entre novamente.',
  TIPO_INVALIDO_PARA_CATEGORIA: 'Escolha um tipo que pertença à categoria selecionada.',
  FOTO_INVALIDA: 'Não foi possível usar esta foto. Escolha outra imagem.',
  LIMITE_FOTOS_EXCEDIDO: 'Você pode enviar no máximo 3 fotos.',
  ACEITE_TERMOS_OBRIGATORIO: 'Aceite os termos de uso e a política de privacidade para continuar.',
  NOME_INVALIDO: 'Informe um nome com 2 a 80 caracteres.',
  EMAIL_JA_CADASTRADO: 'Este e-mail já está em uso. Use outro e-mail ou entre na conta existente.',
  LOCALIZACAO_FORA_DO_MUNICIPIO: 'Por enquanto o Colecity funciona apenas na cidade de São Paulo.',
  CAMPO_OBRIGATORIO: 'Preencha todos os campos obrigatórios.',
  DESCRICAO_TAMANHO_INVALIDO: 'A descrição deve ter de 10 a 500 caracteres.',
  LINHA_INVALIDA: 'Linha não encontrada. Busque e selecione a linha na lista.',
  DATA_OCORRIDO_INVALIDA: 'A data do ocorrido não pode ser futura nem anterior a 30 dias.',
  SOMENTE_AUTOR: 'Apenas quem registrou pode fazer isso.',
  SOMENTE_AFETADO: 'Apenas quem marcou "Também estou sendo afetado" pode reabrir.',
  OCORRENCIA_CONCLUIDA: 'Esta ocorrência já foi concluída e não aceita mais alterações.',
  PRAZO_REABERTURA_EXPIRADO: 'O prazo de 7 dias para reabrir esta ocorrência terminou.',
  REABERTURA_NAO_PERMITIDA: 'Relatos de Segurança não podem ser reabertos.',
  AUTOR_NAO_PODE_APOIAR: 'Você registrou esta ocorrência e já conta como afetado.',
  AUTOR_SEMPRE_AFETADO: 'Quem registrou a ocorrência permanece como afetado.',
  COMENTARIO_TAMANHO_INVALIDO: 'O comentário deve ter de 1 a 500 caracteres.',
  DENUNCIA_JA_REGISTRADA: 'Você já denunciou este conteúdo. Nossa equipe vai analisar.',
  CREDENCIAIS_INVALIDAS: 'E-mail ou senha inválidos.',
  EMAIL_INVALIDO: 'Informe um e-mail válido.',
  SENHA_FRACA: 'A senha deve ter no mínimo 8 caracteres, com letras e números.',
  SENHA_INCORRETA: 'Senha incorreta. Confira e tente de novo.',
  LOGIN_CANCELADO: 'O login foi cancelado.',
  NAO_AUTENTICADO: 'Sua sessão terminou. Entre novamente para continuar.',
  SEM_PERMISSAO: 'Você não tem permissão para fazer isso.',
  NAO_ENCONTRADO: 'Não encontramos este conteúdo. Ele pode ter sido removido.',
  MUITAS_REQUISICOES: 'Muitas ações seguidas, aguarde um instante.',
  OFFLINE: 'Você está offline. Verifique sua conexão e tente novamente.',
  REQUISICAO_INVALIDA: 'Não foi possível concluir. Revise os dados e tente novamente.',
  RECURSO_INDISPONIVEL: 'Este recurso ainda não está disponível nesta versão.',
  ERRO_INTERNO: 'Algo deu errado do nosso lado. Tente novamente em instantes.',
};

/** Erro tipado usado por todos os services (mock e HTTP). */
export class ErroApi extends Error {
  readonly code: CodigoErro;
  readonly status: number;
  /** Erros por campo, quando o domínio informa (`errors` do Problem Details). */
  readonly campos: Record<string, string[]>;

  constructor(code: CodigoErro, status: number, campos: Record<string, string[]> = {}) {
    super(MENSAGENS[code]);
    this.name = 'ErroApi';
    this.code = code;
    this.status = status;
    this.campos = campos;
  }

  get offline(): boolean {
    return this.code === 'OFFLINE';
  }
}

export function ehErroApi(erro: unknown): erro is ErroApi {
  return erro instanceof ErroApi;
}

export function ehCodigoErro(valor: unknown): valor is CodigoErro {
  return typeof valor === 'string' && valor in MENSAGENS;
}

/** Mensagem amigável para qualquer erro capturado. */
export function mensagemDeErro(erro: unknown): string {
  return ehErroApi(erro) ? erro.message : MENSAGENS.ERRO_INTERNO;
}

/** Erros que não adianta repetir (regra de negócio, permissão, validação). */
export function erroDefinitivo(erro: unknown): boolean {
  return ehErroApi(erro) && erro.status >= 400 && erro.status < 500 && erro.status !== 429;
}
