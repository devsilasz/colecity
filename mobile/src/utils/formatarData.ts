const MINUTO = 60 * 1000;
const HORA = 60 * MINUTO;
const DIA = 24 * HORA;

/** "agora", "há 5 min", "há 3 h", "há 2 dias" ou a data, para datas mais antigas. */
export function tempoRelativo(iso: string, agora: Date = new Date()): string {
  const diferenca = agora.getTime() - new Date(iso).getTime();
  if (diferenca < MINUTO) return 'agora';
  if (diferenca < HORA) return `há ${Math.floor(diferenca / MINUTO)} min`;
  if (diferenca < DIA) return `há ${Math.floor(diferenca / HORA)} h`;
  const dias = Math.floor(diferenca / DIA);
  if (dias === 1) return 'há 1 dia';
  if (dias < 30) return `há ${dias} dias`;
  return formatarData(iso);
}

/** "13/11/2026". */
export function formatarData(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/** "13/11/2026 às 15:04". */
export function formatarDataHora(iso: string): string {
  const data = new Date(iso);
  const hora = data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return `${formatarData(iso)} às ${hora}`;
}

/** "15:04". */
export function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function diasAtras(dias: number, agora: Date = new Date()): Date {
  return new Date(agora.getTime() - dias * DIA);
}

export const MS = { MINUTO, HORA, DIA } as const;
