import type { EventoDominio } from './tipos.js';

export interface TextoNotificacao {
  titulo: string;
  corpo: string;
}

const TITULO_ESTADO: Record<string, string> = {
  CONCLUIDA: 'Ocorrência concluída',
  ABERTA: 'Ocorrência reaberta',
  EM_ACOMPANHAMENTO: 'Ocorrência em acompanhamento',
};

/**
 * Texto da notificação. Usa só o título da ocorrência ("Tipo – Rua, Bairro"), que já é público:
 * nunca o conteúdo do comentário, o nome de quem agiu ou qualquer dado pessoal.
 */
export function textoDaNotificacao(evento: EventoDominio): TextoNotificacao {
  const { titulo, novoEstado, linha } = evento.dados;
  switch (evento.tipo) {
    case 'ocorrencia.comentario_criado':
      return { titulo: 'Novo comentário', corpo: titulo };
    case 'ocorrencia.estado_alterado':
      return { titulo: TITULO_ESTADO[novoEstado ?? ''] ?? 'Ocorrência atualizada', corpo: titulo };
    case 'transporte.desvio_confirmado':
      return { titulo: 'Desvio de rota confirmado', corpo: linha ? `Linha ${linha} – ${titulo}` : titulo };
  }
}
