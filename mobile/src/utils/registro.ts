import { valorLinha, valorTexto, type LocalEscolhido, type ValoresFormulario } from '@/context/RegistroContext';
import { TIPOS_POR_CATEGORIA, type Categoria, type TipoOcorrencia } from '@/types/categoria';
import type { BuscaSemelhantes } from '@/types/ocorrencia';

/** Confere se o valor do campo "tipo" pertence à categoria (RN-REG-05: não há tipo livre). */
export function tipoDaCategoria(categoria: Categoria, valor: string): TipoOcorrencia | null {
  const tipos: readonly TipoOcorrencia[] = TIPOS_POR_CATEGORIA[categoria];
  return tipos.find((tipo) => tipo === valor) ?? null;
}

/** Dados do primeiro passo do registro, já validados, usados na busca de semelhantes e na criação. */
export function montarBusca(
  categoria: Categoria | null,
  valores: ValoresFormulario,
  local: LocalEscolhido | null,
): BuscaSemelhantes | null {
  if (!categoria || !local) return null;
  const tipo = tipoDaCategoria(categoria, valorTexto(valores.tipo));
  if (!tipo) return null;
  return {
    categoria,
    tipo,
    localizacao: local.coordenada,
    // RN-REG-03: linha só existe em Transporte.
    linha: categoria === 'TRANSPORTE' ? (valorLinha(valores.linha)?.codigo ?? null) : null,
  };
}
