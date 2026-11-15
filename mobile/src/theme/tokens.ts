import type { TextStyle } from 'react-native';

export const espacos = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
} as const;

export const raios = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pilula: 999,
} as const;

/** Área de toque mínima (RN-GER-02). */
export const TOQUE_MINIMO = 44;

/** Altura da barra compacta do cabeçalho e da tab bar flutuante. */
export const ALTURA_CABECALHO = 48;
export const ALTURA_TAB_BAR = 64;
export const MARGEM_TAB_BAR = 12;

export type VarianteTexto =
  | 'tituloGrande'
  | 'titulo1'
  | 'titulo2'
  | 'titulo3'
  | 'destaque'
  | 'corpo'
  | 'corpoForte'
  | 'chamada'
  | 'subtitulo'
  | 'nota'
  | 'notaForte'
  | 'legenda';

/** Escala tipográfica no estilo Apple (fonte do sistema). */
export const tipografia: Record<VarianteTexto, TextStyle> = {
  tituloGrande: { fontSize: 34, lineHeight: 41, fontWeight: '800', letterSpacing: 0.2 },
  titulo1: { fontSize: 28, lineHeight: 34, fontWeight: '700', letterSpacing: 0.2 },
  titulo2: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
  titulo3: { fontSize: 20, lineHeight: 25, fontWeight: '600' },
  destaque: { fontSize: 17, lineHeight: 22, fontWeight: '600' },
  corpo: { fontSize: 17, lineHeight: 24, fontWeight: '400' },
  corpoForte: { fontSize: 17, lineHeight: 24, fontWeight: '600' },
  chamada: { fontSize: 16, lineHeight: 21, fontWeight: '400' },
  subtitulo: { fontSize: 15, lineHeight: 20, fontWeight: '400' },
  nota: { fontSize: 13, lineHeight: 18, fontWeight: '400' },
  notaForte: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  legenda: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
};

/** Limite de ampliação da fonte do sistema, para o layout não quebrar. */
export const ESCALA_FONTE_MAXIMA = 1.8;

/** Sombras suaves e difusas (boxShadow funciona em iOS e Android). */
export const sombras = {
  nenhuma: undefined,
  suave: (cor: string) => `0px 4px 16px ${cor}`,
  media: (cor: string) => `0px 10px 30px ${cor}`,
  flutuante: (cor: string) => `0px 16px 40px ${cor}`,
} as const;

export const duracoes = {
  rapida: 140,
  normal: 240,
  lenta: 420,
} as const;
