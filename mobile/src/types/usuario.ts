/** Usuário do domínio (doc 10, seção 4.1). */
export interface Usuario {
  id: string;
  nome: string;
  email: string;
  aceiteTermosVersao: string;
  criadoEm: string;
}

export type ProvedorLogin = 'senha' | 'google';

/** Usuário autenticado (Firebase Auth / mock). */
export interface UsuarioAuth {
  uid: string;
  nome: string;
  email: string;
  /** Métodos de login vinculados à conta (RN-CON-10, 12, 13). */
  provedores: ProvedorLogin[];
}

export interface DadosCadastro {
  nome: string;
  email: string;
  senha: string;
  aceiteTermosVersao: string;
}

/**
 * Resultado do login com Google (RN-CON-11): no primeiro acesso é preciso aceitar
 * os termos antes de a conta ser criada.
 */
export type ResultadoLoginGoogle =
  | { tipo: 'SESSAO'; usuario: UsuarioAuth }
  | { tipo: 'ACEITE_NECESSARIO'; nome: string; email: string };

export interface EdicaoPerfil {
  nome?: string;
  email?: string;
}

/** Dados do próprio usuário guardados pelo app (doc 08, seção 8). */
export interface EstadoOcorrenciaUsuario {
  muted: boolean;
  lastSeenAt: string | null;
}

/** Versão vigente dos termos de uso e da política de privacidade. */
export const VERSAO_TERMOS = '2026-11';
