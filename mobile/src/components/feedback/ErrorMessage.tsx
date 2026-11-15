import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { useTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';

export interface ErrorMessageProps {
  /** Mensagem que diz o que fazer, sem códigos técnicos (RN-GER-11). */
  mensagem?: string;
  aoTentarNovamente?: () => void;
  tentando?: boolean;
  /** Versão compacta, para usar dentro de cartões e seções. */
  compacto?: boolean;
}

export const MENSAGEM_ERRO_PADRAO =
  'Não foi possível carregar agora. Verifique sua conexão e tente novamente.';

/** Erro com ação de tentar novamente. */
export function ErrorMessage({
  mensagem = MENSAGEM_ERRO_PADRAO,
  aoTentarNovamente,
  tentando = false,
  compacto = false,
}: ErrorMessageProps) {
  const { cores } = useTema();
  return (
    <View style={[styles.raiz, compacto && styles.compacto]} accessibilityLiveRegion="polite">
      <View style={[styles.icone, compacto && styles.iconeCompacto, { backgroundColor: cores.perigoSuave }]}>
        <Icon nome="cloud-offline-outline" tamanho={compacto ? 22 : 32} cor="perigo" />
      </View>
      {compacto ? null : (
        <AppText variante="titulo3" centralizado>
          Algo deu errado
        </AppText>
      )}
      <AppText variante="subtitulo" cor="textoSecundario" centralizado>
        {mensagem}
      </AppText>
      {aoTentarNovamente ? (
        <CustomButton
          titulo="Tentar novamente"
          icone="refresh-outline"
          variante="tonal"
          tamanho={compacto ? 'medio' : 'grande'}
          onPress={aoTentarNovamente}
          carregando={tentando}
          larguraTotal={false}
          style={styles.acao}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { alignItems: 'center', gap: espacos.sm, paddingVertical: espacos.xxxl, paddingHorizontal: espacos.xxl },
  compacto: { paddingVertical: espacos.lg, paddingHorizontal: espacos.lg },
  icone: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: espacos.sm,
  },
  iconeCompacto: { width: 44, height: 44, borderRadius: 22, marginBottom: 0 },
  acao: { alignSelf: 'center', marginTop: espacos.sm },
});
