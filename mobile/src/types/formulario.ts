import type { Categoria } from './categoria';

/** Formulário dinâmico do registro — doc 09, seção 4.2. */

export type FieldType = 'text' | 'multiline' | 'select' | 'datetime' | 'linha' | 'fotos';

export interface FormField {
  id: string;
  label: string;
  type: FieldType;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  options?: { label: string; value: string }[];
  maxItems?: number;
  /** Texto de apoio exibido abaixo do campo. */
  help?: string;
  /**
   * Em que passo do registro o campo aparece. `inicio` = junto da categoria e da localização,
   * antes das sugestões de semelhantes (RN-SEM-01, RN-SEM-03); padrão: `detalhes`.
   */
  step?: PassoFormulario;
}

export type PassoFormulario = 'inicio' | 'detalhes';

export interface CategoriaFormConfig {
  categoria: Categoria;
  fields: FormField[];
  /** Aviso fixo exibido no topo do formulário (ex.: RN-REG-12 em Segurança). */
  aviso?: string;
}
