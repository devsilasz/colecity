import { StyleSheet, View } from 'react-native';

import { FotoPicker } from '@/components/ocorrencia/FotoPicker';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { CustomInput } from '@/components/ui/CustomInput';
import {
  valorFotos,
  valorLinha,
  valorTexto,
  type ValorCampo,
  type ValoresFormulario,
} from '@/context/RegistroContext';
import { espacos } from '@/theme';
import type { FormField } from '@/types/formulario';
import { dataOcorridoValida } from '@/utils/validacoes';

import { CampoDataHora } from './CampoDataHora';
import { CampoLinha } from './CampoLinha';

export interface DynamicFieldProps {
  campo: FormField;
  valor: ValorCampo | undefined;
  aoMudar: (valor: ValorCampo) => void;
  erro?: string | null;
  disabled?: boolean;
}

/** Renderiza um campo do formulário de registro a partir do `type` do JSON (doc 09 §4.2). */
export function DynamicField({ campo, valor, aoMudar, erro, disabled = false }: DynamicFieldProps) {
  switch (campo.type) {
    case 'text':
    case 'multiline':
      return (
        <CustomInput
          rotulo={campo.label}
          obrigatorio={campo.required}
          multiline={campo.type === 'multiline'}
          contador={campo.maxLength !== undefined}
          maxLength={campo.maxLength}
          value={valorTexto(valor)}
          onChangeText={aoMudar}
          erro={erro}
          ajuda={campo.help}
          editable={!disabled}
        />
      );

    case 'select': {
      const escolhido = valorTexto(valor);
      return (
        <View style={styles.grupo}>
          <AppText variante="notaForte" cor="textoSecundario">
            {campo.label}
            {campo.required ? ' *' : ''}
          </AppText>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={campo.label}>
            {(campo.options ?? []).map((opcao) => (
              <Chip
                key={opcao.value}
                rotulo={opcao.label}
                selecionado={escolhido === opcao.value}
                onPress={() => {
                  if (!disabled) aoMudar(opcao.value);
                }}
              />
            ))}
          </View>
          {erro ? (
            <AppText variante="nota" cor="perigo" accessibilityLiveRegion="polite">
              {erro}
            </AppText>
          ) : campo.help ? (
            <AppText variante="nota" cor="textoTerciario">
              {campo.help}
            </AppText>
          ) : null}
        </View>
      );
    }

    case 'datetime':
      return (
        <CampoDataHora
          rotulo={campo.label}
          ajuda={campo.help}
          valor={valorTexto(valor) || null}
          aoMudar={aoMudar}
          erro={erro}
          disabled={disabled}
        />
      );

    case 'linha':
      return (
        <CampoLinha
          rotulo={campo.label}
          ajuda={campo.help}
          valor={valorLinha(valor)}
          aoMudar={aoMudar}
          erro={erro}
          disabled={disabled}
        />
      );

    case 'fotos':
      return (
        <View style={styles.grupo}>
          <AppText variante="notaForte" cor="textoSecundario">
            {campo.label}
            {campo.required ? ' *' : ''}
          </AppText>
          <FotoPicker fotos={valorFotos(valor)} aoMudar={aoMudar} maximo={campo.maxItems} disabled={disabled} />
          {erro ? (
            <AppText variante="nota" cor="perigo" accessibilityLiveRegion="polite">
              {erro}
            </AppText>
          ) : null}
        </View>
      );
  }
}

/** Valida os campos conforme o JSON: obrigatórios, tamanho e data. Devolve erros por `id`. */
export function validarCampos(
  campos: readonly FormField[],
  valores: ValoresFormulario,
): Record<string, string> {
  const erros: Record<string, string> = {};

  for (const campo of campos) {
    const valor = valores[campo.id];

    if (campo.type === 'fotos') {
      const fotos = valorFotos(valor);
      if (campo.required && fotos.length === 0) erros[campo.id] = 'Adicione pelo menos uma foto.';
      else if (campo.maxItems !== undefined && fotos.length > campo.maxItems) {
        erros[campo.id] = `Você pode enviar no máximo ${campo.maxItems} fotos.`;
      }
      continue;
    }

    if (campo.type === 'linha') {
      if (campo.required && !valorLinha(valor)) erros[campo.id] = 'Busque e selecione a linha na lista.';
      continue;
    }

    const texto = valorTexto(valor).trim();
    if (texto.length === 0) {
      if (campo.required) {
        erros[campo.id] = campo.type === 'select' ? 'Escolha uma opção.' : 'Preencha este campo.';
      }
      continue;
    }

    if (campo.type === 'datetime') {
      if (!dataOcorridoValida(texto)) {
        erros[campo.id] = 'A data do ocorrido não pode ser futura nem anterior a 30 dias.';
      }
      continue;
    }

    const min = campo.minLength ?? 0;
    const max = campo.maxLength ?? Number.MAX_SAFE_INTEGER;
    if (texto.length < min || texto.length > max) {
      erros[campo.id] =
        campo.maxLength !== undefined
          ? `Escreva de ${min} a ${campo.maxLength} caracteres.`
          : `Escreva pelo menos ${min} caracteres.`;
    }
  }

  return erros;
}

const styles = StyleSheet.create({
  grupo: { gap: espacos.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
});
