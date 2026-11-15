import { Badge } from '@/components/ui/Badge';
import { NOME_CATEGORIA } from '@/config/categorias';
import { useTema } from '@/context/ThemeContext';
import { aparenciaCategoria, comAlfa } from '@/theme';
import type { Categoria } from '@/types/categoria';

export interface CategoriaBadgeProps {
  categoria: Categoria;
  tamanho?: 'pequeno' | 'medio';
}

export function CategoriaBadge({ categoria, tamanho }: CategoriaBadgeProps) {
  const { esquema, escuro } = useTema();
  const aparencia = aparenciaCategoria[categoria];
  const cor = aparencia.cor[esquema];

  return (
    <Badge
      rotulo={NOME_CATEGORIA[categoria]}
      rotuloAcessivel={`Categoria: ${NOME_CATEGORIA[categoria]}`}
      icone={aparencia.icone}
      cor={cor}
      fundo={comAlfa(cor, escuro ? 0.18 : 0.12)}
      tamanho={tamanho}
    />
  );
}
