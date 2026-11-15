import { CATALOGO_CATEGORIAS } from '@/config/categorias';
import type { Categoria } from '@/types/categoria';
import type { CategoriaFormConfig, FormField } from '@/types/formulario';
import { LIMITES } from '@/utils/validacoes';

/**
 * Configuração (JSON) dos formulários de registro por categoria — doc 09, seção 4.2.
 * A tela de registro percorre `fields` e renderiza um `DynamicField` para cada `type`.
 */

/** RN-REG-12. */
export const AVISO_SEGURANCA =
  'Em emergência, ligue 190. Registre o B.O. na Delegacia Eletrônica. O Colecity não substitui a polícia.';

const AJUDA_SEGURANCA = 'Não inclua dados de terceiros (descrição física, placa ou nome).';

function campoTipo(categoria: Categoria): FormField {
  const info = CATALOGO_CATEGORIAS.find((item) => item.categoria === categoria);
  return {
    id: 'tipo',
    label: 'Tipo',
    type: 'select',
    required: true,
    step: 'inicio',
    options: (info?.tipos ?? []).map(({ tipo, nome }) => ({ label: nome, value: tipo })),
  };
}

function campoDescricao(categoria: Categoria): FormField {
  return {
    id: 'descricao',
    label: 'Descrição',
    type: 'multiline',
    required: true,
    minLength: LIMITES.descricaoMin,
    maxLength: LIMITES.descricaoMax,
    help: categoria === 'SEGURANCA' ? AJUDA_SEGURANCA : 'Conte o que está acontecendo, de 10 a 500 caracteres.',
  };
}

const CAMPO_FOTOS: FormField = {
  id: 'fotos',
  label: 'Fotos',
  type: 'fotos',
  required: false,
  maxItems: LIMITES.fotosMax,
  help: 'Opcional, até 3 fotos.',
};

const CAMPO_LINHA: FormField = {
  id: 'linha',
  label: 'Linha de ônibus, metrô ou trem',
  type: 'linha',
  required: false,
  // Antes dos semelhantes: a linha também é critério de semelhança (RN-SEM-03).
  step: 'inicio',
  help: 'Opcional. Ajuda a encontrar relatos da mesma linha.',
};

const CAMPO_DATA_OCORRIDO: FormField = {
  id: 'dataHoraOcorrido',
  label: 'Data e hora do ocorrido',
  type: 'datetime',
  required: false,
  help: 'Opcional. Se não informar, vale o momento do registro. Até 30 dias atrás.',
};

function montar(categoria: Categoria): CategoriaFormConfig {
  const fields: FormField[] = [campoTipo(categoria)];
  // RN-REG-03: linha só em Transporte; data e hora do ocorrido só em Segurança.
  if (categoria === 'TRANSPORTE') fields.push(CAMPO_LINHA);
  if (categoria === 'SEGURANCA') fields.push(CAMPO_DATA_OCORRIDO);
  fields.push(campoDescricao(categoria), CAMPO_FOTOS);

  return categoria === 'SEGURANCA' ? { categoria, fields, aviso: AVISO_SEGURANCA } : { categoria, fields };
}

/** Campos de um passo do registro, na ordem do JSON. */
export function camposDoPasso(config: CategoriaFormConfig, passo: 'inicio' | 'detalhes'): FormField[] {
  return config.fields.filter((campo) => (campo.step ?? 'detalhes') === passo);
}

export const FORMULARIOS: Record<Categoria, CategoriaFormConfig> = {
  TRANSPORTE: montar('TRANSPORTE'),
  AGUA: montar('AGUA'),
  ENERGIA: montar('ENERGIA'),
  VIAS: montar('VIAS'),
  ARVORES: montar('ARVORES'),
  SEGURANCA: montar('SEGURANCA'),
  RISCOS_INFRAESTRUTURA: montar('RISCOS_INFRAESTRUTURA'),
};
