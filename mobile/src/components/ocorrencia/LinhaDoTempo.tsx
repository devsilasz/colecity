import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Icon } from '@/components/ui/Icon';
import { useTema } from '@/context/ThemeContext';
import { espacos, type NomeIcone } from '@/theme';
import type { EventoLinhaDoTempo, TipoEventoLinhaDoTempo } from '@/types/ocorrencia';
import { formatarDataHora } from '@/utils/formatarData';

const ICONE: Record<TipoEventoLinhaDoTempo, NomeIcone> = {
  CRIADA: 'add-circle-outline',
  ESTADO_ALTERADO: 'swap-horizontal-outline',
  MARCO_AFETADOS: 'people-outline',
  DESVIO_DETECTADO: 'git-branch-outline',
  CONCLUIDA: 'checkmark-circle-outline',
  REABERTA: 'refresh-outline',
};

/** Linha do tempo automática da ocorrência (RN-ACO-03), do mais antigo para o mais novo. */
export function LinhaDoTempo({ eventos }: { eventos: readonly EventoLinhaDoTempo[] }) {
  const { cores } = useTema();

  return (
    <View>
      {eventos.map((evento, indice) => {
        const ultimo = indice === eventos.length - 1;
        return (
          <View
            key={`${evento.tipo}-${evento.em}-${indice}`}
            accessible
            accessibilityLabel={`${evento.descricao}, em ${formatarDataHora(evento.em)}`}
            style={styles.evento}>
            <View style={styles.trilho}>
              <View style={[styles.marcador, { backgroundColor: cores.primariaSuave }]}>
                <Icon nome={ICONE[evento.tipo]} tamanho={16} cor="primaria" />
              </View>
              {ultimo ? null : <View style={[styles.fio, { backgroundColor: cores.divisor }]} />}
            </View>
            <View style={[styles.textos, !ultimo && styles.espacoAbaixo]}>
              <AppText variante="subtitulo">{evento.descricao}</AppText>
              <AppText variante="nota" cor="textoTerciario">
                {formatarDataHora(evento.em)}
              </AppText>
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  evento: { flexDirection: 'row', gap: espacos.md },
  trilho: { alignItems: 'center', width: 32 },
  marcador: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  fio: { flex: 1, width: 2, marginVertical: espacos.xs },
  textos: { flex: 1, gap: espacos.xxs, paddingTop: espacos.xs },
  espacoAbaixo: { paddingBottom: espacos.lg },
});
