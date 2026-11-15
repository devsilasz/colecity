import { paletas, type EsquemaCor, type Paleta } from './colors';

export * from './categorias';
export * from './colors';
export * from './tokens';

export interface Tema {
  esquema: EsquemaCor;
  escuro: boolean;
  cores: Paleta;
}

export function criarTema(esquema: EsquemaCor): Tema {
  return { esquema, escuro: esquema === 'dark', cores: paletas[esquema] };
}
