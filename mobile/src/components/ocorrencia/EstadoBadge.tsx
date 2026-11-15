import { Badge } from '@/components/ui/Badge';
import { useTema } from '@/context/ThemeContext';
import { aparenciaEstado, comAlfa } from '@/theme';
import { NOME_ESTADO, type EstadoOcorrencia } from '@/types/estado';

export interface EstadoBadgeProps {
  estado: EstadoOcorrencia;
  tamanho?: 'pequeno' | 'medio';
}

export function EstadoBadge({ estado, tamanho }: EstadoBadgeProps) {
  const { esquema, escuro } = useTema();
  const aparencia = aparenciaEstado[estado];
  const cor = aparencia.cor[esquema];

  return (
    <Badge
      rotulo={NOME_ESTADO[estado]}
      rotuloAcessivel={`Estado: ${NOME_ESTADO[estado]}`}
      icone={aparencia.icone}
      cor={cor}
      fundo={comAlfa(cor, escuro ? 0.18 : 0.12)}
      tamanho={tamanho}
    />
  );
}
