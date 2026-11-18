import type { Conclusao, EventoLinhaDoTempo, Foto } from '@/types/ocorrencia';
import { VERSAO_TERMOS } from '@/types/usuario';
import { MS } from '@/utils/formatarData';
import { estadoPorRegra } from '@/utils/regrasOcorrencia';

import type { ComentarioMock, OcorrenciaMock, UsuarioMock } from './banco';
import { OCORRENCIAS_SEMENTE } from './ocorrencias';
import { LINHAS_SEMENTE } from './transporte';
import { UID_DEMO, USUARIOS_SEMENTE } from './usuarios';

/**
 * Monta os dados iniciais a partir das sementes. Módulo sem dependência de React Native:
 * é usado pelo banco mock (no app) e pelo script `scripts/seed-firestore.ts` (no Node).
 */

export function idSemente(prefixo: string, numero: number): string {
  return `${prefixo}000000-0000-4000-8000-${String(numero).padStart(12, '0')}`;
}

function hash(texto: string): number {
  let valor = 0;
  for (let i = 0; i < texto.length; i += 1) valor = (valor * 31 + texto.charCodeAt(i)) | 0;
  return valor;
}

/** Foto de exemplo (serviço público de imagens de demonstração). */
export function fotoExemplo(semente: string, dono: string): Foto {
  return {
    id: idSemente('f', Math.abs(hash(semente)) % 1_000_000),
    path: `ocorrencias/${dono}/${semente}.webp`,
    url: `https://picsum.photos/seed/colecity-${semente}/960/720`,
  };
}

export interface DadosSemente {
  usuarios: UsuarioMock[];
  ocorrencias: OcorrenciaMock[];
  comentarios: ComentarioMock[];
}

/** `agora` em milissegundos: as datas das sementes são relativas a ele. */
export function montarSementes(agora: number): DadosSemente {
  const iso = (msAtras: number) => new Date(agora - msAtras).toISOString();

  const usuarios: UsuarioMock[] = USUARIOS_SEMENTE.map((semente) => ({
    ...semente,
    aceiteTermosVersao: VERSAO_TERMOS,
    criadoEm: iso(90 * MS.DIA),
    removido: false,
  }));

  const comentarios: ComentarioMock[] = [];

  const ocorrencias: OcorrenciaMock[] = OCORRENCIAS_SEMENTE.map((semente, indice) => {
    const id = idSemente('o', indice + 1);
    const autorId = USUARIOS_SEMENTE[semente.autor].id;
    const criadaEm = iso(semente.criadaDiasAtras * MS.DIA);

    const afetadosIds = [autorId];
    if (semente.demoAfetado && autorId !== UID_DEMO) afetadosIds.push(UID_DEMO);
    const apoiadoresIds: string[] = [];
    if (semente.demoApoio && autorId !== UID_DEMO) apoiadoresIds.push(UID_DEMO);
    // Dois apoiadores identificados, diferentes do autor, quando há apoios suficientes.
    USUARIOS_SEMENTE.filter((u) => u.id !== autorId && u.id !== UID_DEMO)
      .slice(indice % 4, (indice % 4) + 2)
      .forEach((u) => {
        if (apoiadoresIds.length < semente.apoios) apoiadoresIds.push(u.id);
      });

    const linhaDoTempo: EventoLinhaDoTempo[] = [
      { tipo: 'CRIADA', descricao: 'Ocorrência registrada', em: criadaEm },
    ];
    const duracao = semente.criadaDiasAtras * MS.DIA - semente.atividadeHorasAtras * MS.HORA;
    const passo = (fracao: number) => iso(semente.criadaDiasAtras * MS.DIA - duracao * fracao);
    if (semente.categoria !== 'SEGURANCA' && semente.afetados >= 3) {
      linhaDoTempo.push({
        tipo: 'ESTADO_ALTERADO',
        descricao: 'Passou para Em acompanhamento ao atingir 3 afetados',
        em: passo(0.15),
      });
    }
    ([10, 50, 100] as const).forEach((marco, i) => {
      if (semente.afetados >= marco) {
        linhaDoTempo.push({
          tipo: 'MARCO_AFETADOS',
          descricao: `${marco} pessoas afetadas`,
          em: passo(0.3 + i * 0.2),
        });
      }
    });

    let estado = estadoPorRegra(semente.categoria, semente.afetados);
    let concluidaEm: string | null = null;
    let conclusao: Conclusao | null = null;
    if (semente.concluida) {
      estado = 'CONCLUIDA';
      concluidaEm = iso(semente.concluida.diasAtras * MS.DIA);
      conclusao = {
        motivo: semente.concluida.motivo,
        feedback: semente.concluida.feedback ?? null,
        fotos: Array.from({ length: semente.concluida.fotos ?? 0 }, (_, n) =>
          fotoExemplo(`conclusao-${indice}-${n}`, autorId),
        ),
      };
      linhaDoTempo.push({
        tipo: 'CONCLUIDA',
        descricao:
          semente.concluida.motivo === 'AUTOR'
            ? 'Marcada como concluída por quem registrou'
            : 'Encerrada automaticamente por inatividade',
        em: concluidaEm,
      });
    }

    (semente.comentarios ?? []).forEach((comentario, n) => {
      comentarios.push({
        id: idSemente('c', indice * 10 + n + 1),
        ocorrenciaId: id,
        texto: comentario.texto,
        fotos: [],
        autorId: USUARIOS_SEMENTE[comentario.autor].id,
        criadoEm: iso(comentario.horasAtras * MS.HORA),
      });
    });

    const linhaSemente = semente.linha
      ? LINHAS_SEMENTE.find((linha) => linha.codigo === semente.linha)
      : undefined;

    return {
      id,
      categoria: semente.categoria,
      tipo: semente.tipo,
      estado,
      rua: semente.rua,
      bairro: semente.bairro,
      localizacao: { lat: semente.lat, lng: semente.lng },
      descricao: semente.descricao,
      linha: linhaSemente ? { codigo: linhaSemente.codigo, nome: linhaSemente.nome } : null,
      dataHoraOcorrido:
        semente.ocorridoHorasAtras === undefined ? null : iso(semente.ocorridoHorasAtras * MS.HORA),
      fotos: Array.from({ length: semente.fotos ?? 0 }, (_, n) =>
        fotoExemplo(`ocorrencia-${indice}-${n}`, autorId),
      ),
      autorId,
      criadaEm,
      ultimaAtividadeEm: concluidaEm ?? iso(semente.atividadeHorasAtras * MS.HORA),
      concluidaEm,
      conclusao,
      afetadosIds,
      apoiadoresIds,
      afetadosExtras: Math.max(0, semente.afetados - afetadosIds.length),
      apoiosExtras: Math.max(0, semente.apoios - apoiadoresIds.length),
      linhaDoTempo,
    };
  });

  return { usuarios, ocorrencias, comentarios };
}
