/** Enumerações de categoria e tipo — doc 10, seção 2.1 (RN-REG-05). */

export const CATEGORIAS = [
  'TRANSPORTE',
  'AGUA',
  'ENERGIA',
  'VIAS',
  'ARVORES',
  'SEGURANCA',
  'RISCOS_INFRAESTRUTURA',
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

export const TIPOS_POR_CATEGORIA = {
  TRANSPORTE: [
    'ATRASO_INTERVALO_EXCESSIVO',
    'ALTERACAO_ROTA_SEM_AVISO',
    'LINHA_ESTACAO_FORA_OPERACAO',
    'SUPERLOTACAO',
    'PONTO_ESTACAO_DANIFICADO',
  ],
  AGUA: ['FALTA_ABASTECIMENTO', 'BAIXA_PRESSAO', 'VAZAMENTO_VIA', 'AGUA_APARENCIA_ALTERADA'],
  ENERGIA: ['FALTA_ENERGIA', 'OSCILACAO', 'FIACAO_EXPOSTA_CAIDA', 'ILUMINACAO_PUBLICA_APAGADA'],
  VIAS: ['BURACO', 'ALAGAMENTO', 'CALCADA_DANIFICADA', 'SEMAFORO_SINALIZACAO_DEFEITO'],
  ARVORES: ['ARVORE_CAIDA', 'GALHO_RISCO_QUEDA', 'ARVORE_SOBRE_FIACAO'],
  SEGURANCA: ['ASSALTO_ROUBO', 'FURTO', 'LOCAL_MAL_ILUMINADO_ERMO'],
  RISCOS_INFRAESTRUTURA: [
    'RISCO_DESLIZAMENTO',
    'TRECHO_PERIGOSO_PEDESTRES',
    'ESTRUTURA_RISCO_QUEDA',
    'CORREGO_TRANSBORDANDO',
  ],
} as const satisfies Record<Categoria, readonly string[]>;

export type TipoDe<C extends Categoria> = (typeof TIPOS_POR_CATEGORIA)[C][number];
export type TipoOcorrencia = { [C in Categoria]: TipoDe<C> }[Categoria];

/** Resposta de `GET /categorias` (doc 10, seção 4.2). */
export interface CategoriaInfo {
  categoria: Categoria;
  nome: string;
  tipos: { tipo: TipoOcorrencia; nome: string }[];
}
