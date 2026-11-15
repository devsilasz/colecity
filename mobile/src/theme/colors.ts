/**
 * Tokens de cor do Colecity (claro e escuro).
 * Pares texto/fundo escolhidos para contraste WCAG AA (RN-GER-04).
 */

export type EsquemaCor = 'light' | 'dark';

export interface Paleta {
  /** Gradiente de fundo das telas: dá ao vidro o que refletir. */
  fundoGradiente: readonly [string, string, string];
  /** Cor sólida de fundo (atrás do gradiente e em fallbacks). */
  fundo: string;
  /** Manchas de cor suaves sobre o gradiente. */
  brilhoA: string;
  brilhoB: string;

  texto: string;
  textoSecundario: string;
  textoTerciario: string;
  textoInverso: string;

  primaria: string;
  primariaPressionada: string;
  sobrePrimaria: string;
  primariaSuave: string;

  /** Superfícies opacas (cartões de lista, campos). */
  superficie: string;
  superficieAlt: string;

  /** Vidro: tonalidade aplicada sobre o blur. */
  vidroTom: string;
  /** Vidro sem blur (Android antigo ou "reduzir transparência"). */
  vidroSolido: string;
  /** Linha fina clara na borda do vidro. */
  vidroBorda: string;

  borda: string;
  divisor: string;

  sucesso: string;
  sucessoSuave: string;
  alerta: string;
  alertaSuave: string;
  perigo: string;
  perigoSuave: string;
  info: string;
  infoSuave: string;

  /** Contadores de participação. */
  afetados: string;
  apoios: string;

  sombra: string;
  veu: string;
  esqueleto: string;
  esqueletoBrilho: string;
}

export const paletaClara: Paleta = {
  fundoGradiente: ['#E9EFFF', '#F4F0FF', '#E6F6F3'],
  fundo: '#EEF2FB',
  brilhoA: 'rgba(84, 120, 255, 0.22)',
  brilhoB: 'rgba(38, 198, 176, 0.18)',

  texto: '#0B1220',
  textoSecundario: '#414B5E',
  textoTerciario: '#5B6578',
  textoInverso: '#FFFFFF',

  primaria: '#2450D8',
  primariaPressionada: '#1B3FB0',
  sobrePrimaria: '#FFFFFF',
  primariaSuave: 'rgba(36, 80, 216, 0.10)',

  superficie: '#FFFFFF',
  superficieAlt: '#F0F3FA',

  vidroTom: 'rgba(255, 255, 255, 0.58)',
  vidroSolido: 'rgba(255, 255, 255, 0.94)',
  vidroBorda: 'rgba(255, 255, 255, 0.85)',

  borda: 'rgba(15, 23, 42, 0.10)',
  divisor: 'rgba(15, 23, 42, 0.08)',

  sucesso: '#0F6B3A',
  sucessoSuave: 'rgba(15, 107, 58, 0.12)',
  alerta: '#8A5300',
  alertaSuave: 'rgba(196, 124, 0, 0.16)',
  perigo: '#B4232A',
  perigoSuave: 'rgba(180, 35, 42, 0.10)',
  info: '#1D4ED8',
  infoSuave: 'rgba(29, 78, 216, 0.10)',

  afetados: '#B4480C',
  apoios: '#2450D8',

  sombra: 'rgba(23, 37, 84, 0.14)',
  veu: 'rgba(8, 12, 28, 0.38)',
  esqueleto: 'rgba(15, 23, 42, 0.08)',
  esqueletoBrilho: 'rgba(15, 23, 42, 0.14)',
};

export const paletaEscura: Paleta = {
  // Preto de verdade, com cinzas neutros: o brilho é só um reflexo claro e discreto.
  fundoGradiente: ['#000000', '#0B0B0C', '#050505'],
  fundo: '#000000',
  brilhoA: 'rgba(255, 255, 255, 0.06)',
  brilhoB: 'rgba(255, 255, 255, 0.03)',

  texto: '#F5F5F7',
  textoSecundario: '#C7C7CC',
  textoTerciario: '#98989F',
  textoInverso: '#0A0A0A',

  primaria: '#4C9AFF',
  primariaPressionada: '#3A84E6',
  sobrePrimaria: '#00122B',
  primariaSuave: 'rgba(76, 154, 255, 0.16)',

  superficie: '#141416',
  superficieAlt: '#1E1E21',

  vidroTom: 'rgba(40, 40, 43, 0.58)',
  vidroSolido: 'rgba(22, 22, 24, 0.97)',
  vidroBorda: 'rgba(255, 255, 255, 0.14)',

  borda: 'rgba(255, 255, 255, 0.12)',
  divisor: 'rgba(255, 255, 255, 0.10)',

  sucesso: '#6FDB98',
  sucessoSuave: 'rgba(111, 219, 152, 0.16)',
  alerta: '#F5C56B',
  alertaSuave: 'rgba(245, 197, 107, 0.16)',
  perigo: '#FF9494',
  perigoSuave: 'rgba(255, 148, 148, 0.16)',
  info: '#6CB0FF',
  infoSuave: 'rgba(108, 176, 255, 0.16)',

  afetados: '#FDB07A',
  apoios: '#6CB0FF',

  sombra: 'rgba(0, 0, 0, 0.6)',
  veu: 'rgba(0, 0, 0, 0.65)',
  esqueleto: 'rgba(255, 255, 255, 0.08)',
  esqueletoBrilho: 'rgba(255, 255, 255, 0.16)',
};

export const paletas: Record<EsquemaCor, Paleta> = {
  light: paletaClara,
  dark: paletaEscura,
};

/** Converte `#RRGGBB` em `rgba(r, g, b, a)`. */
export function comAlfa(hex: string, alfa: number): string {
  const limpo = hex.replace('#', '');
  const r = parseInt(limpo.slice(0, 2), 16);
  const g = parseInt(limpo.slice(2, 4), 16);
  const b = parseInt(limpo.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alfa})`;
}
