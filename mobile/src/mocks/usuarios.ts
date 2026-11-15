/** Usuários fictícios do mock. Nenhum dado real. */

export interface UsuarioSemente {
  id: string;
  nome: string;
  email: string;
  /** `null` = conta criada só com Google (RN-CON-13). */
  senha: string | null;
  google: boolean;
}

/** Conta de demonstração: use estas credenciais para entrar no app com mock. */
export const CONTA_DEMO = {
  email: 'ana@colecity.app',
  senha: 'colecity123',
} as const;

/** Conta simulada pelo botão "Entrar com Google" no mock. */
export const CONTA_GOOGLE_DEMO = {
  nome: 'Rafael Lima',
  email: 'rafael.lima@gmail.com',
} as const;

function uid(numero: number): string {
  return `u0000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
}

export const USUARIOS_SEMENTE: UsuarioSemente[] = [
  { id: uid(1), nome: 'Ana Souza', email: CONTA_DEMO.email, senha: CONTA_DEMO.senha, google: false },
  { id: uid(2), nome: 'Bruno Carvalho', email: 'bruno@colecity.app', senha: 'colecity123', google: false },
  { id: uid(3), nome: 'Carla Mendes', email: 'carla@colecity.app', senha: 'colecity123', google: false },
  { id: uid(4), nome: 'Diego Nascimento', email: 'diego@colecity.app', senha: 'colecity123', google: false },
  { id: uid(5), nome: 'Elaine Ferreira', email: 'elaine@colecity.app', senha: 'colecity123', google: false },
  { id: uid(6), nome: 'Fábio Rocha', email: 'fabio@colecity.app', senha: 'colecity123', google: false },
  { id: uid(7), nome: 'Gabriela Santos', email: 'gabriela@colecity.app', senha: 'colecity123', google: false },
  { id: uid(8), nome: 'Henrique Alves', email: 'henrique@colecity.app', senha: 'colecity123', google: false },
  { id: uid(9), nome: 'Isabela Costa', email: 'isabela@colecity.app', senha: 'colecity123', google: false },
  { id: uid(10), nome: 'João Pereira', email: 'joao@colecity.app', senha: 'colecity123', google: false },
];

export const UID_DEMO = USUARIOS_SEMENTE[0].id;

/** Nomes públicos para compor listas de apoiadores além dos usuários acima. */
export const NOMES_EXTRAS: readonly string[] = [
  'Karina', 'Leandro', 'Marina', 'Nelson', 'Olívia', 'Paulo', 'Quésia', 'Renato', 'Sueli', 'Tiago',
  'Úrsula', 'Vinícius', 'Wagner', 'Yara', 'Zeca', 'Aline', 'Caio', 'Débora', 'Eduardo', 'Fernanda',
  'Gustavo', 'Helena', 'Igor', 'Juliana', 'Kleber', 'Larissa', 'Marcos', 'Natália', 'Otávio', 'Priscila',
];
