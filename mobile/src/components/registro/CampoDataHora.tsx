import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { useTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';
import { diasAtras, formatarDataHora } from '@/utils/formatarData';
import { LIMITES } from '@/utils/validacoes';

export interface CampoDataHoraProps {
  rotulo: string;
  ajuda?: string;
  /** ISO 8601 ou `null` (não informado). */
  valor: string | null;
  aoMudar: (iso: string | null) => void;
  erro?: string | null;
  disabled?: boolean;
}

/** Data e hora do ocorrido: não futura e até 30 dias atrás (RN-REG-03). */
export function CampoDataHora({ rotulo, ajuda, valor, aoMudar, erro, disabled = false }: CampoDataHoraProps) {
  const { escuro } = useTema();
  const data = valor ? new Date(valor) : null;

  // No Android o seletor é um diálogo: primeiro a data, depois a hora.
  const abrirNoAndroid = () => {
    const agora = new Date();
    DateTimePickerAndroid.open({
      value: data ?? agora,
      mode: 'date',
      maximumDate: agora,
      minimumDate: diasAtras(LIMITES.diasOcorridoMax, agora),
      onChange: (evento, dia) => {
        if (evento.type !== 'set' || !dia) return;
        DateTimePickerAndroid.open({
          value: dia,
          mode: 'time',
          is24Hour: true,
          onChange: (eventoHora, momento) => {
            if (eventoHora.type !== 'set' || !momento) return;
            // Escolher "hoje" com uma hora que ainda não chegou vira "agora".
            aoMudar(new Date(Math.min(momento.getTime(), Date.now())).toISOString());
          },
        });
      },
    });
  };

  return (
    <View style={styles.raiz}>
      <AppText variante="notaForte" cor="textoSecundario">
        {rotulo}
      </AppText>

      {Platform.OS === 'android' ? (
        <CustomButton
          titulo={data ? formatarDataHora(data.toISOString()) : 'Informar data e hora'}
          rotuloAcessivel={
            data ? `${rotulo}: ${formatarDataHora(data.toISOString())}. Tocar para alterar` : `Informar ${rotulo}`
          }
          icone="calendar-outline"
          variante="contorno"
          tamanho="medio"
          onPress={abrirNoAndroid}
          disabled={disabled}
        />
      ) : data ? (
        <DateTimePicker
          value={data}
          mode="datetime"
          display="compact"
          locale="pt-BR"
          themeVariant={escuro ? 'dark' : 'light'}
          maximumDate={new Date()}
          minimumDate={diasAtras(LIMITES.diasOcorridoMax)}
          disabled={disabled}
          onChange={(_evento, momento) => {
            if (momento) aoMudar(momento.toISOString());
          }}
          style={styles.seletorIos}
        />
      ) : (
        <CustomButton
          titulo="Informar data e hora"
          icone="calendar-outline"
          variante="contorno"
          tamanho="medio"
          onPress={() => aoMudar(new Date().toISOString())}
          disabled={disabled}
        />
      )}

      {data ? (
        <CustomButton
          titulo="Usar o momento do registro"
          variante="texto"
          tamanho="medio"
          larguraTotal={false}
          onPress={() => aoMudar(null)}
          disabled={disabled}
        />
      ) : null}

      {erro ? (
        <AppText variante="nota" cor="perigo" accessibilityLiveRegion="polite">
          {erro}
        </AppText>
      ) : ajuda ? (
        <AppText variante="nota" cor="textoTerciario">
          {ajuda}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.xs },
  seletorIos: { alignSelf: 'flex-start' },
});
