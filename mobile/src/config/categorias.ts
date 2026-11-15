import {
  CATEGORIAS,
  TIPOS_POR_CATEGORIA,
  type Categoria,
  type CategoriaInfo,
  type TipoOcorrencia,
} from '@/types/categoria';

/** Nomes exibidos — doc 07, tabela "Categorias e tipos". */
export const NOME_CATEGORIA: Record<Categoria, string> = {
  TRANSPORTE: 'Transporte',
  AGUA: 'Água',
  ENERGIA: 'Energia',
  VIAS: 'Vias',
  ARVORES: 'Árvores',
  SEGURANCA: 'Segurança',
  RISCOS_INFRAESTRUTURA: 'Riscos e infraestrutura',
};

export const NOME_TIPO: Record<TipoOcorrencia, string> = {
  ATRASO_INTERVALO_EXCESSIVO: 'Atraso ou intervalo excessivo',
  ALTERACAO_ROTA_SEM_AVISO: 'Alteração de rota sem aviso',
  LINHA_ESTACAO_FORA_OPERACAO: 'Linha/estação fora de operação',
  SUPERLOTACAO: 'Superlotação',
  PONTO_ESTACAO_DANIFICADO: 'Ponto/estação danificado',
  FALTA_ABASTECIMENTO: 'Falta de abastecimento',
  BAIXA_PRESSAO: 'Baixa pressão',
  VAZAMENTO_VIA: 'Vazamento na via',
  AGUA_APARENCIA_ALTERADA: 'Água com aparência alterada',
  FALTA_ENERGIA: 'Falta de energia',
  OSCILACAO: 'Oscilação',
  FIACAO_EXPOSTA_CAIDA: 'Fiação exposta ou caída',
  ILUMINACAO_PUBLICA_APAGADA: 'Iluminação pública apagada',
  BURACO: 'Buraco',
  ALAGAMENTO: 'Alagamento',
  CALCADA_DANIFICADA: 'Calçada danificada',
  SEMAFORO_SINALIZACAO_DEFEITO: 'Semáforo/sinalização com defeito',
  ARVORE_CAIDA: 'Árvore caída',
  GALHO_RISCO_QUEDA: 'Galho com risco de queda',
  ARVORE_SOBRE_FIACAO: 'Árvore sobre fiação',
  ASSALTO_ROUBO: 'Assalto/roubo',
  FURTO: 'Furto',
  LOCAL_MAL_ILUMINADO_ERMO: 'Local mal iluminado ou ermo',
  RISCO_DESLIZAMENTO: 'Risco de deslizamento',
  TRECHO_PERIGOSO_PEDESTRES: 'Trecho perigoso para pedestres',
  ESTRUTURA_RISCO_QUEDA: 'Imóvel/estrutura com risco de queda',
  CORREGO_TRANSBORDANDO: 'Córrego transbordando',
};

/** Catálogo local, no mesmo formato de `GET /categorias`. */
export const CATALOGO_CATEGORIAS: CategoriaInfo[] = CATEGORIAS.map((categoria) => ({
  categoria,
  nome: NOME_CATEGORIA[categoria],
  tipos: TIPOS_POR_CATEGORIA[categoria].map((tipo) => ({ tipo, nome: NOME_TIPO[tipo] })),
}));

/** Categorias que podem formar Zona de atenção (RN-ZON-01). */
export const CATEGORIAS_ZONA_ATENCAO: readonly Categoria[] = ['SEGURANCA', 'RISCOS_INFRAESTRUTURA'];
