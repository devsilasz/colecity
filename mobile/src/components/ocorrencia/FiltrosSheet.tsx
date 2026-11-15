import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { CustomButton } from '@/components/ui/CustomButton';
import { NOME_CATEGORIA } from '@/config/categorias';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useLocalizacao } from '@/hooks/useLocalizacao';
import { aparenciaCategoria, aparenciaEstado, espacos } from '@/theme';
import { CATEGORIAS, type Categoria } from '@/types/categoria';
import { ESTADOS_OCORRENCIA, NOME_ESTADO, type EstadoOcorrencia } from '@/types/estado';
import type { FiltrosOcorrencias } from '@/types/ocorrencia';

const RAIOS_KM = [1, 5, 10] as const;
type RaioKm = (typeof RAIOS_KM)[number];

function alternar<T>(lista: readonly T[], item: T): T[] {
  return lista.includes(item) ? lista.filter((atual) => atual !== item) : [...lista, item];
}

export interface FiltrosSheetProps {
  visivel: boolean;
  aoFechar: () => void;
  filtros: FiltrosOcorrencias;
  aoMudar: (filtros: FiltrosOcorrencias) => void;
  aoLimpar: () => void;
  /** Total de ocorrências com os filtros atuais, para o botão "Ver N ocorrências". */
  total?: number;
}

/** Filtros de categoria, estado e distância (RN-CSL-03). Cada toque já aplica o filtro. */
export function FiltrosSheet({ visivel, aoFechar, filtros, aoMudar, aoLimpar, total }: FiltrosSheetProps) {
  const { esquema } = useTema();
  const { mostrarToast } = useToast();
  const localizacao = useLocalizacao();

  const escolherRaio = async (raioKm: RaioKm) => {
    if (filtros.proximidade?.raioKm === raioKm) {
      aoMudar({ ...filtros, proximidade: null });
      return;
    }
    // RN-GER-07: a localização é pedida só aqui, no momento de uso.
    const centro = filtros.proximidade?.centro ?? localizacao.posicao ?? (await localizacao.obter());
    if (!centro) {
      mostrarToast('Não foi possível usar sua localização. Verifique a permissão e o GPS.', 'erro');
      return;
    }
    aoMudar({ ...filtros, proximidade: { centro, raioKm } });
  };

  const rotuloBotao =
    total === undefined
      ? 'Ver ocorrências'
      : total === 1
        ? 'Ver 1 ocorrência'
        : `Ver ${total} ocorrências`;

  return (
    <BottomSheet
      visivel={visivel}
      aoFechar={aoFechar}
      titulo="Filtros"
      rodape={
        <>
          <CustomButton titulo={rotuloBotao} onPress={aoFechar} />
          <CustomButton titulo="Limpar filtros" variante="texto" tamanho="medio" onPress={aoLimpar} />
        </>
      }>
      <View style={styles.grupo}>
        <AppText variante="notaForte" cor="textoSecundario" accessibilityRole="header">
          CATEGORIA
        </AppText>
        <View style={styles.chips}>
          {CATEGORIAS.map((categoria: Categoria) => (
            <Chip
              key={categoria}
              rotulo={NOME_CATEGORIA[categoria]}
              icone={aparenciaCategoria[categoria].icone}
              selecionado={filtros.categorias.includes(categoria)}
              onPress={() => aoMudar({ ...filtros, categorias: alternar(filtros.categorias, categoria) })}
            />
          ))}
        </View>
      </View>

      <View style={styles.grupo}>
        <AppText variante="notaForte" cor="textoSecundario" accessibilityRole="header">
          ESTADO
        </AppText>
        <View style={styles.chips}>
          {ESTADOS_OCORRENCIA.map((estado: EstadoOcorrencia) => (
            <Chip
              key={estado}
              rotulo={NOME_ESTADO[estado]}
              icone={aparenciaEstado[estado].icone}
              corDestaque={filtros.estados.includes(estado) ? aparenciaEstado[estado].cor[esquema] : undefined}
              selecionado={filtros.estados.includes(estado)}
              onPress={() => aoMudar({ ...filtros, estados: alternar(filtros.estados, estado) })}
            />
          ))}
        </View>
        <AppText variante="nota" cor="textoTerciario">
          Sem estado marcado, aparecem as abertas e em acompanhamento.
        </AppText>
      </View>

      {/* RN-CSL-03: o filtro de distância some quando a localização foi negada. */}
      {localizacao.permissao !== 'negada' ? (
        <View style={styles.grupo}>
          <AppText variante="notaForte" cor="textoSecundario" accessibilityRole="header">
            DISTÂNCIA DA MINHA POSIÇÃO
          </AppText>
          <View style={styles.chips}>
            {RAIOS_KM.map((raioKm) => (
              <Chip
                key={raioKm}
                rotulo={`Até ${raioKm} km`}
                icone="navigate-outline"
                selecionado={filtros.proximidade?.raioKm === raioKm}
                onPress={() => void escolherRaio(raioKm)}
              />
            ))}
          </View>
          {localizacao.permissao === 'indefinida' ? (
            <AppText variante="nota" cor="textoTerciario">
              Ao escolher uma distância, o app pede acesso à sua localização.
            </AppText>
          ) : null}
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  grupo: { gap: espacos.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
});
