import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { authService, userDataService, usuarioService } from '@/services';
import { configurarAutenticacaoApi } from '@/services/api';
import { invalidarCacheFirestore } from '@/services/firestore/base';
import { filaOffline } from '@/services/offlineQueue';
import { notificacoes } from '@/services/notificacoes';
import { chaves, queryClient } from '@/services/queryClient';
import type { DadosCadastro, UsuarioAuth } from '@/types/usuario';

export type ResultadoTrocaEmail = 'ATUALIZADO' | 'CONFIRMACAO_ENVIADA';

/** Resultado do login com Google visto pelas telas (RN-CON-11). */
export type ResultadoGoogle = { tipo: 'SESSAO' } | { tipo: 'ACEITE_NECESSARIO'; nome: string; email: string };

interface AuthContextValue {
  usuario: UsuarioAuth | null;
  /** `true` enquanto a sessão salva é restaurada ao abrir o app (RN-GER-13). */
  carregando: boolean;
  /** Conta com senha (pode alterar e-mail e senha); `false` em conta só com Google (RN-CON-13, 14). */
  temSenha: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (dados: DadosCadastro) => Promise<void>;
  entrarComGoogle: (aceiteTermosVersao?: string) => Promise<ResultadoGoogle>;
  recuperarSenha: (email: string) => Promise<void>;
  sair: () => Promise<void>;
  atualizarNome: (nome: string) => Promise<void>;
  /**
   * Troca o e-mail (RN-CON-07). Com o Firebase, a troca só vale depois que a pessoa confirma
   * pelo link enviado ao novo endereço: nesse caso devolve `CONFIRMACAO_ENVIADA`.
   */
  alterarEmail: (novoEmail: string, senhaAtual: string) => Promise<ResultadoTrocaEmail>;
  alterarSenha: (senhaAtual: string, novaSenha: string) => Promise<void>;
  definirSenha: (novaSenha: string) => Promise<void>;
  /** Confirma a identidade e exclui a conta (RN-CON-08). `senha` só em conta com senha. */
  excluirConta: (senha?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Os dados em cache trazem campos do usuário (ex.: `podeEditar`): ao trocar a sessão, tudo é refeito. */
function renovarCache(): void {
  invalidarCacheFirestore();
  queryClient.removeQueries({ queryKey: chaves.todasMinhas });
  queryClient.removeQueries({ queryKey: chaves.perfil });
  void queryClient.invalidateQueries();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioAuth | null>(null);
  const [carregando, setCarregando] = useState(true);

  // Restaura a sessão salva (RN-GER-13).
  useEffect(() => {
    let ativo = true;
    authService
      .restaurarSessao()
      .then((salvo) => {
        if (ativo) setUsuario(salvo);
      })
      .catch(() => undefined)
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  const encerrarLocal = useCallback((uid: string | null) => {
    if (uid) filaOffline.limparDoUsuario(uid);
    setUsuario(null);
    renovarCache();
  }, []);

  // Liga o interceptor do Axios à sessão: token no request e logout no 401 definitivo.
  useEffect(() => {
    configurarAutenticacaoApi({
      obterToken: (forcar) => authService.obterToken(forcar),
      encerrarSessao: async () => {
        await authService.sair().catch(() => undefined);
        setUsuario(null);
        renovarCache();
      },
    });
    return () => configurarAutenticacaoApi(null);
  }, []);

  const iniciarSessao = useCallback((novo: UsuarioAuth) => {
    setUsuario(novo);
    renovarCache();
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      const logado = await authService.entrar(email, senha);
      // `PUT /usuarios/me` é idempotente; a conta já existe, então uma falha aqui não impede o login.
      await usuarioService.registrarAcesso({ nome: logado.nome, email: logado.email }).catch(() => undefined);
      iniciarSessao(logado);
    },
    [iniciarSessao],
  );

  const cadastrar = useCallback(
    async (dados: DadosCadastro) => {
      const novo = await authService.cadastrar(dados);
      await usuarioService.registrarAcesso({
        nome: novo.nome,
        email: novo.email,
        aceiteTermosVersao: dados.aceiteTermosVersao,
      });
      iniciarSessao(novo);
    },
    [iniciarSessao],
  );

  const entrarComGoogle = useCallback(
    async (aceiteTermosVersao?: string): Promise<ResultadoGoogle> => {
      const resultado = await authService.entrarComGoogle(aceiteTermosVersao);
      if (resultado.tipo === 'ACEITE_NECESSARIO') return resultado;

      const { usuario: logado } = resultado;
      const acesso = usuarioService.registrarAcesso({ nome: logado.nome, email: logado.email, aceiteTermosVersao });
      // Conta nova (com aceite) precisa chegar ao domínio; em conta existente a falha não impede o login.
      if (aceiteTermosVersao) await acesso;
      else await acesso.catch(() => undefined);
      iniciarSessao(logado);
      return { tipo: 'SESSAO' };
    },
    [iniciarSessao],
  );

  const recuperarSenha = useCallback((email: string) => authService.recuperarSenha(email), []);

  const sair = useCallback(async () => {
    const uid = usuario?.uid ?? null;
    // Antes de encerrar a sessão: este aparelho para de receber o push desta conta.
    if (uid) await notificacoes.desativarAparelho(uid);
    await authService.sair();
    encerrarLocal(uid);
  }, [usuario, encerrarLocal]);

  const atualizarNome = useCallback(async (nome: string) => {
    await usuarioService.atualizarPerfil({ nome });
    setUsuario(await authService.atualizarNome(nome));
    void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
  }, []);

  const alterarEmail = useCallback(async (novoEmail: string, senhaAtual: string): Promise<ResultadoTrocaEmail> => {
    const atualizado = await authService.alterarEmail(novoEmail, senhaAtual);
    setUsuario(atualizado);
    // O e-mail ainda é o antigo: a troca depende da confirmação pelo link.
    if (atualizado.email !== novoEmail.trim().toLowerCase()) return 'CONFIRMACAO_ENVIADA';
    await usuarioService.atualizarPerfil({ email: atualizado.email });
    return 'ATUALIZADO';
  }, []);

  const alterarSenha = useCallback(
    (senhaAtual: string, novaSenha: string) => authService.alterarSenha(senhaAtual, novaSenha),
    [],
  );

  const definirSenha = useCallback(async (novaSenha: string) => {
    setUsuario(await authService.definirSenha(novaSenha));
  }, []);

  const excluirConta = useCallback(
    async (senha?: string) => {
      if (!usuario) return;
      await authService.reautenticar(senha);
      await usuarioService.excluirConta();
      await userDataService.limpar(usuario.uid).catch(() => undefined);
      await authService.excluirConta();
      encerrarLocal(usuario.uid);
    },
    [usuario, encerrarLocal],
  );

  const valor = useMemo<AuthContextValue>(
    () => ({
      usuario,
      carregando,
      temSenha: usuario?.provedores.includes('senha') ?? false,
      entrar,
      cadastrar,
      entrarComGoogle,
      recuperarSenha,
      sair,
      atualizarNome,
      alterarEmail,
      alterarSenha,
      definirSenha,
      excluirConta,
    }),
    [
      usuario,
      carregando,
      entrar,
      cadastrar,
      entrarComGoogle,
      recuperarSenha,
      sair,
      atualizarNome,
      alterarEmail,
      alterarSenha,
      definirSenha,
      excluirConta,
    ],
  );

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) throw new Error('useAuthContext deve ser usado dentro de <AuthProvider>.');
  return contexto;
}
