import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import type { FotoSelecionada } from '@/components/ocorrencia/FotoPicker';
import type { Coordenada } from '@/types/api';
import type { Categoria } from '@/types/categoria';
import type { LinhaRef } from '@/types/transporte';

/** Valor de um campo do formulário dinâmico, conforme o `type` do campo. */
export type ValorCampo = string | LinhaRef | FotoSelecionada[] | null;
export type ValoresFormulario = Record<string, ValorCampo>;

export interface LocalEscolhido {
  coordenada: Coordenada;
  /** "Rua, bairro" quando o aparelho consegue descobrir; só para exibição. */
  endereco: string | null;
}

interface RegistroContextValue {
  categoria: Categoria | null;
  valores: ValoresFormulario;
  local: LocalEscolhido | null;
  /** Trocar a categoria limpa os campos, que mudam de uma para outra. */
  definirCategoria: (categoria: Categoria) => void;
  definirValor: (id: string, valor: ValorCampo) => void;
  definirLocal: (local: LocalEscolhido | null) => void;
  limpar: () => void;
}

const RegistroContext = createContext<RegistroContextValue | null>(null);

/** Rascunho do registro, compartilhado pelos três passos da aba Registrar. */
export function RegistroProvider({ children }: { children: ReactNode }) {
  const [categoria, setCategoria] = useState<Categoria | null>(null);
  const [valores, setValores] = useState<ValoresFormulario>({});
  const [local, setLocal] = useState<LocalEscolhido | null>(null);

  const definirCategoria = useCallback((nova: Categoria) => {
    setCategoria((atual) => {
      if (atual !== nova) setValores({});
      return nova;
    });
  }, []);

  const definirValor = useCallback((id: string, valor: ValorCampo) => {
    setValores((atuais) => ({ ...atuais, [id]: valor }));
  }, []);

  const limpar = useCallback(() => {
    setCategoria(null);
    setValores({});
    setLocal(null);
  }, []);

  const valor = useMemo<RegistroContextValue>(
    () => ({ categoria, valores, local, definirCategoria, definirValor, definirLocal: setLocal, limpar }),
    [categoria, valores, local, definirCategoria, definirValor, limpar],
  );

  return <RegistroContext.Provider value={valor}>{children}</RegistroContext.Provider>;
}

export function useRegistro(): RegistroContextValue {
  const contexto = useContext(RegistroContext);
  if (!contexto) throw new Error('useRegistro deve ser usado dentro de <RegistroProvider>.');
  return contexto;
}

/** Leitores tipados dos valores do formulário. */
export function valorTexto(valor: ValorCampo | undefined): string {
  return typeof valor === 'string' ? valor : '';
}

export function valorFotos(valor: ValorCampo | undefined): FotoSelecionada[] {
  return Array.isArray(valor) ? valor : [];
}

export function valorLinha(valor: ValorCampo | undefined): LinhaRef | null {
  return valor !== null && valor !== undefined && typeof valor === 'object' && !Array.isArray(valor)
    ? valor
    : null;
}
