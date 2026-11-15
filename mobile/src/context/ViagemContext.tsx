import * as Location from 'expo-location';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { env } from '@/config/env';
import { useAuthContext } from '@/context/AuthContext';
import { transporteService } from '@/services';
import { chaves, queryClient } from '@/services/queryClient';
import type { Coordenada } from '@/types/api';
import type { LinhaRef } from '@/types/transporte';

/**
 * RN-TAV-04: a posição é enviada a cada 1 minuto.
 * Com mock, o intervalo cai para 10 s só para o fluxo de desvio caber em uma demonstração.
 */
export const INTERVALO_POSICAO_MS = env.usarMock ? 10 * 1000 : 60 * 1000;

export interface ViagemAtiva {
  viagemId: string;
  expiraEm: string;
  linha: LinhaRef;
  sentido: 1 | 2;
  destino: string;
  /** Quantas posições já foram enviadas nesta viagem. */
  posicoesEnviadas: number;
}

export type MotivoFim = 'USUARIO' | 'EXPIRADA' | 'SERVIDOR';

export type ResultadoInicio = 'INICIADA' | 'SEM_PERMISSAO';

interface ViagemContextValue {
  viagem: ViagemAtiva | null;
  /** Trecho fora do trajeto aguardando a resposta "O ônibus mudou de rota?" (RN-TAV-07). */
  desvioPendente: Coordenada[] | null;
  /** Por que a última viagem terminou sem o usuário pedir; a tela mostra e limpa. */
  ultimoFim: MotivoFim | null;
  limparUltimoFim: () => void;
  /** Só começa por ação explícita, com a permissão de localização concedida (RN-TAV-05). */
  iniciar: (linha: LinhaRef, sentido: 1 | 2, destino: string) => Promise<ResultadoInicio>;
  encerrar: () => Promise<void>;
  /** Devolve o id da ocorrência criada/reforçada, ou `null` se o usuário negou o desvio. */
  responderDesvio: (confirmado: boolean) => Promise<string | null>;
}

const ViagemContext = createContext<ViagemContextValue | null>(null);

async function posicaoAtual(): Promise<Coordenada | null> {
  try {
    const atual = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { lat: atual.coords.latitude, lng: atual.coords.longitude };
  } catch {
    return null;
  }
}

/**
 * "Estou neste ônibus": viagem ativa do usuário, válida para o app inteiro enquanto ele está aberto.
 * Não há envio em segundo plano (RN-TAV-08): com o app fechado ou minimizado, os envios param.
 */
export function ViagemProvider({ children }: { children: ReactNode }) {
  const { usuario } = useAuthContext();
  const uid = usuario?.uid ?? null;

  // A viagem guarda de quem é: ao sair da conta (ou trocar), ela deixa de valer sem precisar de efeito.
  const [viagemSalva, setViagem] = useState<(ViagemAtiva & { uid: string }) | null>(null);
  const [desvioSalvo, setDesvioPendente] = useState<Coordenada[] | null>(null);
  const viagem = viagemSalva && viagemSalva.uid === uid ? viagemSalva : null;
  const desvioPendente = viagem ? desvioSalvo : null;
  const [ultimoFim, setUltimoFim] = useState<MotivoFim | null>(null);
  const enviando = useRef(false);

  const finalizarLocal = useCallback((motivo: MotivoFim) => {
    setViagem(null);
    setDesvioPendente(null);
    if (motivo !== 'USUARIO') setUltimoFim(motivo);
    void queryClient.invalidateQueries({ queryKey: ['transporte-veiculos'] });
  }, []);

  const viagemId = viagem?.viagemId ?? null;
  const expiraEm = viagem?.expiraEm ?? null;

  // Envio periódico da posição enquanto a viagem está ativa.
  useEffect(() => {
    if (!viagemId || !expiraEm) return;
    let ativo = true;

    const enviar = async () => {
      if (enviando.current) return;
      // RN-TAV-05: a viagem termina após 2 horas.
      if (Date.now() >= new Date(expiraEm).getTime()) {
        void transporteService.encerrarViagem(viagemId).catch(() => undefined);
        finalizarLocal('EXPIRADA');
        return;
      }

      enviando.current = true;
      try {
        const posicao = await posicaoAtual();
        if (!ativo) return;
        // Sem GPS neste instante: tenta de novo no próximo ciclo.
        if (!posicao) return;

        const resposta = await transporteService.enviarPosicao(viagemId, {
          posicao,
          registradaEm: new Date().toISOString(),
        });
        if (!ativo) return;

        if (!resposta.ativa) {
          finalizarLocal('SERVIDOR');
          return;
        }
        setViagem((atual) =>
          atual && atual.viagemId === viagemId
            ? { ...atual, posicoesEnviadas: atual.posicoesEnviadas + 1 }
            : atual,
        );
        if (resposta.desvioSuspeito) setDesvioPendente(resposta.trechoDesvio ?? []);
        void queryClient.invalidateQueries({ queryKey: ['transporte-veiculos'] });
      } catch {
        // Falha de rede: a próxima tentativa acontece no ciclo seguinte.
      } finally {
        enviando.current = false;
      }
    };

    void enviar();
    const temporizador = setInterval(() => void enviar(), INTERVALO_POSICAO_MS);
    return () => {
      ativo = false;
      clearInterval(temporizador);
    };
  }, [viagemId, expiraEm, finalizarLocal]);

  const iniciar = useCallback(
    async (linha: LinhaRef, sentido: 1 | 2, destino: string): Promise<ResultadoInicio> => {
      if (!uid) throw new Error('Compartilhar a viagem exige login.');
      // RN-GER-07: a localização é pedida só aqui, na ação explícita.
      const permissao = await Location.requestForegroundPermissionsAsync();
      if (!permissao.granted) return 'SEM_PERMISSAO';

      // RN-TAV-04: iniciar outra viagem encerra a anterior (o servidor faz o mesmo).
      const nova = await transporteService.iniciarViagem(linha.codigo, sentido);
      setUltimoFim(null);
      setDesvioPendente(null);
      setViagem({ ...nova, uid, linha, sentido, destino, posicoesEnviadas: 0 });
      return 'INICIADA';
    },
    [uid],
  );

  const encerrar = useCallback(async () => {
    if (!viagemId) return;
    finalizarLocal('USUARIO');
    await transporteService.encerrarViagem(viagemId).catch(() => undefined);
  }, [viagemId, finalizarLocal]);

  const responderDesvio = useCallback(
    async (confirmado: boolean): Promise<string | null> => {
      if (!viagemId) return null;
      const resposta = await transporteService.responderDesvio(viagemId, confirmado);
      setDesvioPendente(null);
      if (resposta.ocorrenciaId) {
        void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
        void queryClient.invalidateQueries({ queryKey: chaves.mapa });
      }
      return resposta.ocorrenciaId;
    },
    [viagemId],
  );

  const limparUltimoFim = useCallback(() => setUltimoFim(null), []);

  const valor = useMemo<ViagemContextValue>(
    () => ({ viagem, desvioPendente, ultimoFim, limparUltimoFim, iniciar, encerrar, responderDesvio }),
    [viagem, desvioPendente, ultimoFim, limparUltimoFim, iniciar, encerrar, responderDesvio],
  );

  return <ViagemContext.Provider value={valor}>{children}</ViagemContext.Provider>;
}

export function useViagemContext(): ViagemContextValue {
  const contexto = useContext(ViagemContext);
  if (!contexto) throw new Error('useViagemContext deve ser usado dentro de <ViagemProvider>.');
  return contexto;
}
