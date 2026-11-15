import { NOMES_EXTRAS } from '@/mocks/usuarios';

/** Nomes determinísticos para os apoiadores "extras" de uma ocorrência do mock. */
export function nomesApoiadoresExtras(ocorrenciaId: string, quantidade: number): string[] {
  let deslocamento = 0;
  for (let i = 0; i < ocorrenciaId.length; i += 1) deslocamento += ocorrenciaId.charCodeAt(i);
  return Array.from(
    { length: quantidade },
    (_, indice) => NOMES_EXTRAS[(deslocamento + indice) % NOMES_EXTRAS.length],
  );
}
