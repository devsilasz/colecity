import type { Ionicons } from '@expo/vector-icons';

import type { Categoria } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';

import type { EsquemaCor } from './colors';

export type NomeIcone = keyof typeof Ionicons.glyphMap;

interface AparenciaSemantica {
  icone: NomeIcone;
  /** Cor de texto/ícone por tema (contraste AA sobre o fundo suave). */
  cor: Record<EsquemaCor, string>;
}

/** Cada categoria tem cor E ícone: a informação nunca depende só da cor (RN-GER-03). */
export const aparenciaCategoria: Record<Categoria, AparenciaSemantica> = {
  TRANSPORTE: { icone: 'bus-outline', cor: { light: '#1D4ED8', dark: '#6CB0FF' } },
  AGUA: { icone: 'water-outline', cor: { light: '#0B6B82', dark: '#67E0F2' } },
  ENERGIA: { icone: 'flash-outline', cor: { light: '#855400', dark: '#FCD268' } },
  VIAS: { icone: 'trail-sign-outline', cor: { light: '#A8430B', dark: '#FDB07A' } },
  ARVORES: { icone: 'leaf-outline', cor: { light: '#146C34', dark: '#7EE2A0' } },
  SEGURANCA: { icone: 'shield-outline', cor: { light: '#B01E1E', dark: '#FF9B9B' } },
  RISCOS_INFRAESTRUTURA: { icone: 'warning-outline', cor: { light: '#7420C2', dark: '#D8A8FF' } },
};

export const aparenciaEstado: Record<EstadoOcorrencia, AparenciaSemantica> = {
  ABERTA: { icone: 'radio-button-on-outline', cor: { light: '#1D4ED8', dark: '#6CB0FF' } },
  EM_ACOMPANHAMENTO: { icone: 'eye-outline', cor: { light: '#855400', dark: '#FCD268' } },
  CONCLUIDA: { icone: 'checkmark-circle-outline', cor: { light: '#0F6B3A', dark: '#6FDB98' } },
};
