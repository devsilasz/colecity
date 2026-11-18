import type { Pagina } from '@/types/api';

/** Paginação do contrato (`page`, `pageSize` até 50), aplicada no aparelho. */
export function paginar<T>(itens: readonly T[], page: number, pageSize: number): Pagina<T> {
  const tamanho = Math.min(Math.max(pageSize, 1), 50);
  const pagina = Math.max(page, 1);
  const inicio = (pagina - 1) * tamanho;
  return { items: itens.slice(inicio, inicio + tamanho), page: pagina, pageSize: tamanho, total: itens.length };
}
