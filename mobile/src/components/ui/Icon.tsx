import { Ionicons } from '@expo/vector-icons';

import { useTema } from '@/context/ThemeContext';
import type { NomeIcone } from '@/theme';

import type { CorTexto } from './AppText';

export interface IconProps {
  nome: NomeIcone;
  tamanho?: number;
  cor?: CorTexto;
  corCustom?: string;
  /** Informe só quando o ícone transmite informação sozinho; senão ele é decorativo. */
  rotulo?: string;
}

/** Ícones de traço fino (Ionicons outline). Decorativos por padrão para o leitor de tela. */
export function Icon({ nome, tamanho = 22, cor = 'texto', corCustom, rotulo }: IconProps) {
  const { cores } = useTema();
  return (
    <Ionicons
      name={nome}
      size={tamanho}
      color={corCustom ?? cores[cor]}
      accessible={Boolean(rotulo)}
      accessibilityLabel={rotulo}
      accessibilityRole={rotulo ? 'image' : undefined}
      importantForAccessibility={rotulo ? 'yes' : 'no'}
    />
  );
}
