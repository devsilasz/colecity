import { useState, type ComponentRef, type Ref } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { ESCALA_FONTE_MAXIMA, espacos, raios, tipografia, type NomeIcone } from '@/theme';

import { AppText } from './AppText';
import { Icon } from './Icon';
import { IconButton } from './IconButton';

export interface CustomInputProps extends Omit<TextInputProps, 'style'> {
  rotulo: string;
  erro?: string | null;
  ajuda?: string;
  icone?: NomeIcone;
  /** Campo de senha com botão de mostrar/ocultar. */
  senha?: boolean;
  /** Mostra o contador "atual/máximo" (exige `maxLength`). */
  contador?: boolean;
  obrigatorio?: boolean;
  ref?: Ref<ComponentRef<typeof TextInput>>;
}

export function CustomInput({
  rotulo,
  erro,
  ajuda,
  icone,
  senha = false,
  contador = false,
  obrigatorio = false,
  multiline,
  maxLength,
  value,
  editable = true,
  onFocus,
  onBlur,
  ref,
  ...resto
}: CustomInputProps) {
  const { cores } = useTema();
  const [focado, setFocado] = useState(false);
  const [oculto, setOculto] = useState(senha);

  const corBorda = erro ? cores.perigo : focado ? cores.primaria : cores.borda;

  return (
    <View style={styles.raiz}>
      <AppText variante="notaForte" cor="textoSecundario">
        {rotulo}
        {obrigatorio ? ' *' : ''}
      </AppText>

      <View
        style={[
          styles.campo,
          multiline && styles.campoMultilinha,
          {
            backgroundColor: editable ? cores.superficie : cores.superficieAlt,
            borderColor: corBorda,
            borderWidth: focado || erro ? 1.5 : 1,
          },
        ]}>
        {icone ? <Icon nome={icone} tamanho={20} cor="textoTerciario" /> : null}
        <TextInput
          ref={ref}
          accessibilityLabel={obrigatorio ? `${rotulo}, obrigatório` : rotulo}
          accessibilityHint={erro ?? ajuda}
          accessibilityState={{ disabled: !editable }}
          placeholderTextColor={cores.textoTerciario}
          selectionColor={cores.primaria}
          maxFontSizeMultiplier={ESCALA_FONTE_MAXIMA}
          {...resto}
          value={value}
          editable={editable}
          multiline={multiline}
          maxLength={maxLength}
          secureTextEntry={oculto}
          textAlignVertical={multiline ? 'top' : 'center'}
          onFocus={(evento) => {
            setFocado(true);
            onFocus?.(evento);
          }}
          onBlur={(evento) => {
            setFocado(false);
            onBlur?.(evento);
          }}
          style={[
            styles.entrada,
            multiline && styles.entradaMultilinha,
            { color: editable ? cores.texto : cores.textoTerciario },
          ]}
        />
        {senha ? (
          <IconButton
            icone={oculto ? 'eye-outline' : 'eye-off-outline'}
            rotulo={oculto ? 'Mostrar senha' : 'Ocultar senha'}
            cor="textoTerciario"
            tamanhoIcone={20}
            onPress={() => setOculto((atual) => !atual)}
          />
        ) : null}
      </View>

      <View style={styles.rodape}>
        <View style={styles.mensagem}>
          {erro ? (
            <View style={styles.erro} accessibilityLiveRegion="polite">
              <Icon nome="alert-circle-outline" tamanho={16} cor="perigo" />
              <AppText variante="nota" cor="perigo" style={styles.flex}>
                {erro}
              </AppText>
            </View>
          ) : ajuda ? (
            <AppText variante="nota" cor="textoTerciario">
              {ajuda}
            </AppText>
          ) : null}
        </View>
        {contador && maxLength ? (
          <AppText
            variante="nota"
            cor="textoTerciario"
            accessibilityLabel={`${value?.length ?? 0} de ${maxLength} caracteres`}>
            {value?.length ?? 0}/{maxLength}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.xs },
  campo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    minHeight: 52,
    borderRadius: raios.md,
    borderCurve: 'continuous',
    paddingLeft: espacos.lg,
    paddingRight: espacos.xs,
  },
  campoMultilinha: { alignItems: 'flex-start', paddingVertical: espacos.md, paddingRight: espacos.lg },
  entrada: { ...tipografia.corpo, flex: 1, paddingVertical: espacos.md, paddingRight: espacos.md },
  entradaMultilinha: { minHeight: 112, paddingVertical: 0, paddingRight: 0 },
  rodape: { flexDirection: 'row', gap: espacos.sm, minHeight: 18 },
  mensagem: { flex: 1 },
  erro: { flexDirection: 'row', gap: espacos.xs, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
