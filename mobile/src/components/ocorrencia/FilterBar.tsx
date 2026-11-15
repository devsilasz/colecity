import { ScrollView, StyleSheet } from 'react-native';

import { Chip } from '@/components/ui/Chip';
import { NOME_CATEGORIA } from '@/config/categorias';
import { aparenciaCategoria, espacos } from '@/theme';
import { CATEGORIAS } from '@/types/categoria';
import type { FiltrosOcorrencias } from '@/types/ocorrencia';

export interface FilterBarProps {
  filtros: FiltrosOcorrencias;
  /** Quantos filtros estão ativos (categoria + estado + distância). */
  quantidade: number;
  aoMudar: (filtros: FiltrosOcorrencias) => void;
  aoAbrirFiltros: () => void;
}

/** Barra rolável: botão "Filtros" + atalho de categorias (RN-CSL-03). */
export function FilterBar({ filtros, quantidade, aoMudar, aoAbrirFiltros }: FilterBarProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={styles.rolagem}
      contentContainerStyle={styles.conteudo}>
      <Chip
        rotulo={quantidade > 0 ? `Filtros (${quantidade})` : 'Filtros'}
        rotuloAcessivel={
          quantidade > 0 ? `Filtros, ${quantidade} ativos. Abrir todos os filtros` : 'Abrir filtros'
        }
        icone="options-outline"
        selecionado={false}
        onPress={aoAbrirFiltros}
      />
      {CATEGORIAS.map((categoria) => {
        const selecionado = filtros.categorias.includes(categoria);
        return (
          <Chip
            key={categoria}
            rotulo={NOME_CATEGORIA[categoria]}
            rotuloAcessivel={`Filtrar por ${NOME_CATEGORIA[categoria]}`}
            icone={aparenciaCategoria[categoria].icone}
            selecionado={selecionado}
            onPress={() =>
              aoMudar({
                ...filtros,
                categorias: selecionado
                  ? filtros.categorias.filter((atual) => atual !== categoria)
                  : [...filtros.categorias, categoria],
              })
            }
          />
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Sangra até as bordas da tela, compensando o recuo horizontal do conteúdo.
  rolagem: { marginHorizontal: -espacos.lg, flexGrow: 0 },
  conteudo: { paddingHorizontal: espacos.lg, gap: espacos.sm },
});
