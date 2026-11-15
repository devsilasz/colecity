import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { env } from '@/config/env';
import { AVISO_NAO_OFICIAL } from '@/config/termos';
import { espacos } from '@/theme';

/** Sobre: aviso de não ser canal oficial (RN-GER-08), termos e versão. */
export default function SobreScreen() {
  const router = useRouter();

  return (
    <ScreenScroll titulo="Sobre" aoVoltar={() => router.back()}>
      <Card style={styles.texto}>
        <AppText variante="subtitulo">
          O Colecity é um aplicativo colaborativo para relatar, acompanhar e se mobilizar em torno de
          problemas urbanos da cidade de São Paulo.
        </AppText>
      </Card>

      <Card style={styles.aviso}>
        <Icon nome="information-circle-outline" tamanho={22} cor="info" />
        <AppText variante="subtitulo" style={styles.flex}>
          {AVISO_NAO_OFICIAL}
        </AppText>
      </Card>

      <Card style={styles.aviso}>
        <Icon nome="call-outline" tamanho={22} cor="perigo" />
        <AppText variante="subtitulo" style={styles.flex}>
          Em emergência, ligue 190. O Colecity não substitui a polícia.
        </AppText>
      </Card>

      <SectionTitle>Documentos</SectionTitle>
      <Card semPadding>
        <ListRow
          icone="document-text-outline"
          titulo="Termos de uso e privacidade"
          onPress={() => router.push('/termos')}
        />
      </Card>

      <SectionTitle>Aplicativo</SectionTitle>
      <Card semPadding>
        <ListRow
          icone="pricetag-outline"
          titulo="Versão"
          valor={Constants.expoConfig?.version ?? '1.0.0'}
          divisor
        />
        <ListRow
          icone="construct-outline"
          titulo="Ambiente"
          descricao={env.usarMock ? 'Dados de demonstração (mock)' : 'Conectado ao servidor'}
          valor={env.ambiente}
        />
      </Card>
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  texto: { gap: espacos.sm },
  aviso: { flexDirection: 'row', gap: espacos.md, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
