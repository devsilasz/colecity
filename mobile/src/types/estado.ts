/** Doc 10, seção 2.2. */
export const ESTADOS_OCORRENCIA = ['ABERTA', 'EM_ACOMPANHAMENTO', 'CONCLUIDA'] as const;

export type EstadoOcorrencia = (typeof ESTADOS_OCORRENCIA)[number];

export const NOME_ESTADO: Record<EstadoOcorrencia, string> = {
  ABERTA: 'Aberta',
  EM_ACOMPANHAMENTO: 'Em acompanhamento',
  CONCLUIDA: 'Concluída',
};
