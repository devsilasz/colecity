import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AVISO_NAO_OFICIAL, POLITICA_DE_PRIVACIDADE, TERMOS_DE_USO, type SecaoTexto } from '@/config/termos';
import { useSairDoLogin } from '@/hooks/useSairDoLogin';
import { espacos } from '@/theme';
import { VERSAO_TERMOS } from '@/types/usuario';

function Secoes({ secoes }: { secoes: readonly SecaoTexto[] }) {
  return (
    <Card style={styles.cartao}>
      {secoes.map((secao) => (
        <View key={secao.titulo} style={styles.secao}>
          <AppText variante="destaque" accessibilityRole="header">
            {secao.titulo}
          </AppText>
          {secao.paragrafos.map((paragrafo) => (
            <AppText key={paragrafo} variante="subtitulo" cor="textoSecundario">
              {paragrafo}
            </AppText>
          ))}
        </View>
      ))}
    </Card>
  );
}

/** Termos de uso e política de privacidade, acessíveis sem login (RN-GER-06). */
export default function TermosScreen() {
  const router = useRouter();
  const sair = useSairDoLogin();

  return (
    <ScreenScroll
      titulo="Termos e privacidade"
      subtitulo={`Versão ${VERSAO_TERMOS}`}
      aoVoltar={() => (router.canGoBack() ? router.back() : sair())}>
      <Card style={styles.aviso}>
        <Icon nome="information-circle-outline" tamanho={22} cor="info" />
        <AppText variante="subtitulo" style={styles.flex}>
          {AVISO_NAO_OFICIAL}
        </AppText>
      </Card>

      <SectionTitle>Termos de uso</SectionTitle>
      <Secoes secoes={TERMOS_DE_USO} />

      <SectionTitle>Política de privacidade</SectionTitle>
      <Secoes secoes={POLITICA_DE_PRIVACIDADE} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  aviso: { flexDirection: 'row', gap: espacos.md, alignItems: 'flex-start' },
  cartao: { gap: espacos.lg },
  secao: { gap: espacos.xs },
  flex: { flex: 1 },
});
