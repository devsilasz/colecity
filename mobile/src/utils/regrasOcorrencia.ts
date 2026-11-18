import { CATEGORIAS_ZONA_ATENCAO, NOME_TIPO } from '@/config/categorias';
import type { Coordenada } from '@/types/api';
import type { Categoria, TipoOcorrencia } from '@/types/categoria';
import type { EstadoOcorrencia } from '@/types/estado';
import type { PontoCalor, ZonaAtencao } from '@/types/ocorrencia';

import { aproximar, distanciaMetros } from './distancia';
import { MS } from './formatarData';

/** Regras de ocorrência compartilhadas pelos adaptadores de dados (mock e Firestore). */

/** RN-REG-07: o título é gerado como "Tipo – Rua, Bairro". */
export function tituloOcorrencia(tipo: TipoOcorrencia, rua: string, bairro: string): string {
  const local = rua ? `${rua}, ${bairro}` : bairro || 'Localização aproximada';
  return `${NOME_TIPO[tipo]} – ${local}`;
}

/** Estado derivado das regras RN-ACO-02 (3 afetados) e RN-ACO-09 (Segurança fica Aberta). */
export function estadoPorRegra(categoria: Categoria, totalAfetados: number): EstadoOcorrencia {
  if (categoria === 'SEGURANCA') return 'ABERTA';
  return totalAfetados >= 3 ? 'EM_ACOMPANHAMENTO' : 'ABERTA';
}

/** RN-MOD-02: com 5 denúncias de contas distintas o conteúdo fica oculto. */
export const DENUNCIAS_PARA_OCULTAR = 5;

/** RN-CSL-07: aviso exibido junto das contagens. */
export const AVISO_CONTAGEM = 'Participações registradas no Colecity; não representam o total de afetados.';

const RAIO_ZONA_M = 300;
const CELULAS_POR_GRAU = 200;
const MINIMO_RELATOS_ZONA = 5;

/** O mínimo que o cálculo de Zona de atenção precisa saber de cada relato. */
export interface RelatoZona {
  id: string;
  categoria: Categoria;
  criadaEm: string;
  localizacao: Coordenada;
  autorId: string;
}

/** RN-ZON-01 a 03: 5+ relatos de contas distintas, mesma categoria, 300 m, 30 dias. */
export function calcularZonas(ocorrencias: readonly RelatoZona[]): ZonaAtencao[] {
  const limite = Date.now() - 30 * MS.DIA;
  const zonas: ZonaAtencao[] = [];

  for (const categoria of CATEGORIAS_ZONA_ATENCAO) {
    const relatos = ocorrencias.filter(
      (o) => o.categoria === categoria && new Date(o.criadaEm).getTime() >= limite,
    );
    const usados = new Set<string>();

    const grupos = relatos
      .map((centro) => relatos.filter((o) => distanciaMetros(centro.localizacao, o.localizacao) <= RAIO_ZONA_M))
      .sort((a, b) => b.length - a.length);

    for (const grupo of grupos) {
      const livres = grupo.filter((o) => !usados.has(o.id));
      const contas = new Set(livres.map((o) => o.autorId));
      if (contas.size < MINIMO_RELATOS_ZONA) continue;

      livres.forEach((o) => usados.add(o.id));
      const centro = aproximar({
        lat: livres.reduce((soma, o) => soma + o.localizacao.lat, 0) / livres.length,
        lng: livres.reduce((soma, o) => soma + o.localizacao.lng, 0) / livres.length,
      });
      zonas.push({
        categoria,
        centro,
        raioMetros: RAIO_ZONA_M,
        totalRelatos: livres.length,
        texto: `${livres.length} relatos da comunidade nos últimos 30 dias`,
      });
    }
  }
  return zonas;
}

/** A ocorrência está dentro de alguma Zona de atenção da sua categoria? */
export function emZona(
  ocorrencia: { categoria: Categoria; localizacao: Coordenada },
  zonas: readonly ZonaAtencao[],
): boolean {
  return zonas.some(
    (zona) =>
      zona.categoria === ocorrencia.categoria &&
      distanciaMetros(ocorrencia.localizacao, zona.centro) <= zona.raioMetros + 100,
  );
}

/** Mapa de calor: afetados somados por célula de ~500 m (RN-DES-01). */
export function calcularCalor(
  ocorrencias: readonly { localizacao: Coordenada; totalAfetados: number }[],
): PontoCalor[] {
  const celulas = new Map<string, PontoCalor>();
  for (const ocorrencia of ocorrencias) {
    const lat = Math.round(ocorrencia.localizacao.lat * CELULAS_POR_GRAU) / CELULAS_POR_GRAU;
    const lng = Math.round(ocorrencia.localizacao.lng * CELULAS_POR_GRAU) / CELULAS_POR_GRAU;
    const chave = `${lat},${lng}`;
    celulas.set(chave, { lat, lng, peso: (celulas.get(chave)?.peso ?? 0) + ocorrencia.totalAfetados });
  }
  return [...celulas.values()];
}
