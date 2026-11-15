import { useAuthContext } from '@/context/AuthContext';

/** Sessão e ações de conta (login, cadastro, sair, excluir). */
export function useAuth() {
  return useAuthContext();
}
