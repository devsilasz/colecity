import type { Evento, OcorrenciaDoc } from './tipos.js';

/** Mesmos nomes exibidos no app (`mobile/src/config/categorias.ts`). */
const NOME_TIPO: Record<string, string> = {
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

const TITULO: Record<Evento, string> = {
  comentario: 'Novo comentário',
  concluida: 'Ocorrência concluída',
  reaberta: 'Ocorrência reaberta',
};

export interface TextoNotificacao {
  titulo: string;
  corpo: string;
}

/**
 * Texto da notificação. Só usa o tipo e o local aproximado (rua e bairro), que já são públicos:
 * nunca o conteúdo do comentário, o nome de quem agiu ou qualquer dado pessoal.
 */
export function textoDaNotificacao(evento: Evento, ocorrencia: OcorrenciaDoc): TextoNotificacao {
  const tipo = NOME_TIPO[ocorrencia.tipo] ?? 'Ocorrência';
  const local = ocorrencia.rua ? `${ocorrencia.rua}, ${ocorrencia.bairro}` : ocorrencia.bairro;
  return { titulo: TITULO[evento], corpo: local ? `${tipo} – ${local}` : tipo };
}
