/** Convenções do contrato (doc 10, seção 1). */

export interface Coordenada {
  lat: number;
  lng: number;
}

/** Resposta paginada: `?page=1&pageSize=20`. */
export interface Pagina<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface AreaMapa {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

/** Códigos estáveis de erro do domínio (doc 10) + códigos gerados no próprio app. */
export type CodigoErro =
  // Doc 10
  | 'USUARIO_NAO_CADASTRADO'
  | 'TIPO_INVALIDO_PARA_CATEGORIA'
  | 'FOTO_INVALIDA'
  | 'LIMITE_FOTOS_EXCEDIDO'
  | 'ACEITE_TERMOS_OBRIGATORIO'
  | 'NOME_INVALIDO'
  | 'EMAIL_JA_CADASTRADO'
  | 'LOCALIZACAO_FORA_DO_MUNICIPIO'
  | 'CAMPO_OBRIGATORIO'
  | 'DESCRICAO_TAMANHO_INVALIDO'
  | 'LINHA_INVALIDA'
  | 'DATA_OCORRIDO_INVALIDA'
  | 'SOMENTE_AUTOR'
  | 'SOMENTE_AFETADO'
  | 'OCORRENCIA_CONCLUIDA'
  | 'PRAZO_REABERTURA_EXPIRADO'
  | 'REABERTURA_NAO_PERMITIDA'
  | 'AUTOR_NAO_PODE_APOIAR'
  | 'AUTOR_SEMPRE_AFETADO'
  | 'COMENTARIO_TAMANHO_INVALIDO'
  | 'DENUNCIA_JA_REGISTRADA'
  // Autenticação (Firebase Auth / mock)
  | 'CREDENCIAIS_INVALIDAS'
  | 'EMAIL_INVALIDO'
  | 'SENHA_FRACA'
  | 'SENHA_INCORRETA'
  | 'LOGIN_CANCELADO'
  // Gerados pelo app (interceptor)
  | 'NAO_AUTENTICADO'
  | 'SEM_PERMISSAO'
  | 'NAO_ENCONTRADO'
  | 'MUITAS_REQUISICOES'
  | 'OFFLINE'
  | 'REQUISICAO_INVALIDA'
  | 'RECURSO_INDISPONIVEL'
  | 'ERRO_INTERNO';

/** Corpo de erro Problem Details (RFC 7807) com `code` (doc 10, seção 1.2). */
export interface ProblemDetails {
  type?: string;
  title?: string;
  status: number;
  code?: string;
  errors?: Record<string, string[]>;
}
