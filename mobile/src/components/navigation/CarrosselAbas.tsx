import { Navigator, useRouter, useSegments } from 'expo-router';
import { useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { ABAS } from './GlassTabBar';

/** Fração da largura, ou velocidade (pt/s), a partir da qual soltar o dedo troca de aba. */
const FRACAO_TROCA = 0.3;
const VELOCIDADE_TROCA = 500;
/** Resistência ao puxar além da primeira ou da última aba. */
const RESISTENCIA_PONTA = 0.2;
const ANIMACAO = { duration: 260, easing: Easing.out(Easing.cubic) };

// ── Suspensão do gesto ─────────────────────────────────────────────────────────────────
// Onde outro conteúdo também se arrasta para os lados (mapa, barra de filtros), o gesto para.
let bloqueios = 0;
const ouvintes = new Set<() => void>();

function alterarBloqueios(delta: number): void {
  bloqueios = Math.max(0, bloqueios + delta);
  ouvintes.forEach((avisar) => avisar());
}

function assinar(avisar: () => void): () => void {
  ouvintes.add(avisar);
  return () => {
    ouvintes.delete(avisar);
  };
}

/** Para usar em `onTouchStart` / `onTouchEnd` de um conteúdo que rola na horizontal. */
export const gestoAbas = {
  suspender: () => alterarBloqueios(1),
  retomar: () => alterarBloqueios(-1),
};

/** Suspende a troca de aba por gesto enquanto `ativo` (ex.: mapa em tela cheia). */
export function useBloquearGestoAbas(ativo: boolean): void {
  useEffect(() => {
    if (!ativo) return;
    alterarBloqueios(1);
    return () => alterarBloqueios(-1);
  }, [ativo]);
}

// ── Página ─────────────────────────────────────────────────────────────────────────────
interface PaginaAbaProps {
  indice: number;
  focada: boolean;
  posicao: SharedValue<number>;
  largura: number;
  children: ReactNode;
}

/** Uma aba do carrossel: fica ao lado das vizinhas e desliza junto com `posicao`. */
function PaginaAba({ indice, focada, posicao, largura, children }: PaginaAbaProps) {
  const estilo = useAnimatedStyle(() => ({
    transform: [{ translateX: (indice - posicao.get()) * largura }],
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, estilo]}
      // As abas ao lado existem só para o deslize: não recebem toque nem foco do leitor de tela.
      pointerEvents={focada ? 'auto' : 'none'}
      accessibilityElementsHidden={!focada}
      importantForAccessibility={focada ? 'auto' : 'no-hide-descendants'}>
      {children}
    </Animated.View>
  );
}

/**
 * Conteúdo das abas em carrossel: arrastar a tela para os lados leva à aba vizinha, com as duas
 * telas acompanhando o dedo. A animação roda fora da thread do JavaScript (Reanimated).
 * Só vale na raiz de cada aba; nas telas empilhadas (detalhe, formulários) o gesto fica livre.
 * A tab bar continua funcionando e é o caminho para quem usa leitor de tela.
 */
export function CarrosselAbas() {
  const router = useRouter();
  const segmentos = useSegments();
  const { width: largura } = useWindowDimensions();
  const bloqueado = useSyncExternalStore(assinar, () => bloqueios > 0);

  const naRaizDaAba = segmentos.length <= 2;
  const indice = ABAS.findIndex((aba) => aba.nome === segmentos[1]);
  const ultima = ABAS.length - 1;

  /** Posição do carrossel em "abas": 0 = primeira, 1,5 = entre a segunda e a terceira. */
  const posicao = useSharedValue(Math.max(indice, 0));
  /** Aba para onde o carrossel está indo (evita reanimar quando a troca veio do próprio gesto). */
  const alvo = useSharedValue(Math.max(indice, 0));
  const inicio = useSharedValue(0);

  // Troca feita pela tab bar (ou por navegação): desliza até a aba.
  useEffect(() => {
    if (indice < 0 || alvo.get() === indice) return;
    alvo.set(indice);
    posicao.set(withTiming(indice, ANIMACAO));
  }, [indice, alvo, posicao]);

  const irPara = (destino: number) => {
    const aba = ABAS[destino];
    if (aba) router.navigate(`/${aba.nome}`);
  };

  const gesto = usePanGesture({
    enabled: naRaizDaAba && indice >= 0 && !bloqueado,
    // Só começa em arrasto claramente horizontal; rolagem vertical segue normal.
    activeOffsetX: [-16, 16],
    failOffsetY: [-12, 12],
    onActivate: () => {
      'worklet';
      inicio.set(alvo.get());
    },
    onUpdate: (evento) => {
      'worklet';
      const livre = inicio.get() - evento.translationX / largura;
      if (livre < 0) posicao.set(livre * RESISTENCIA_PONTA);
      else if (livre > ultima) posicao.set(ultima + (livre - ultima) * RESISTENCIA_PONTA);
      else posicao.set(livre);
    },
    onDeactivate: (evento) => {
      'worklet';
      let destino = inicio.get();
      if (!evento.canceled) {
        const avancou = evento.translationX < -largura * FRACAO_TROCA || evento.velocityX < -VELOCIDADE_TROCA;
        const voltou = evento.translationX > largura * FRACAO_TROCA || evento.velocityX > VELOCIDADE_TROCA;
        if (avancou) destino += 1;
        else if (voltou) destino -= 1;
      }
      destino = Math.min(Math.max(destino, 0), ultima);
      const mudou = destino !== inicio.get();
      alvo.set(destino);
      posicao.set(withTiming(destino, ANIMACAO));
      if (mudou) scheduleOnRN(irPara, destino);
    },
  });

  // O estado das abas do expo-router só lista as abas já visitadas, na ordem da visita. Por isso
  // cada página é localizada pelo nome e posicionada pela ordem da tab bar (ABAS), nunca pelo
  // índice do estado. As abas ainda não visitadas usam o descritor provisório (chave = nome).
  const { state, descriptors } = Navigator.useContext();
  const chaveFocada = state.routes[state.index]?.key;

  return (
    <GestureDetector gesture={gesto}>
      <View style={styles.raiz} collapsable={false}>
        {ABAS.map((aba, posicaoNaBarra) => {
          const rota = state.routes.find((r) => r.name === aba.nome);
          const descritor = descriptors[rota?.key ?? aba.nome];
          if (!descritor) return null;
          return (
            <PaginaAba
              key={aba.nome}
              indice={posicaoNaBarra}
              focada={rota !== undefined && rota.key === chaveFocada}
              posicao={posicao}
              largura={largura}>
              {descritor.render()}
            </PaginaAba>
          );
        })}
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, overflow: 'hidden' },
});
