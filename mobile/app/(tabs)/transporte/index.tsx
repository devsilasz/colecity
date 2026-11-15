import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { Skeleton } from '@/components/feedback/Skeleton';
import { ViagemAtivaCard } from '@/components/transporte/ViagemAtivaCard';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { CustomInput } from '@/components/ui/CustomInput';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useBuscaLinhas } from '@/hooks/useViagem';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';

/** Transporte ao vivo: busca da linha por número ou nome, aberta a visitantes (RN-TAV-01). */
export default function TransporteScreen() {
  const router = useRouter();
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');

  // Espera a pessoa parar de digitar antes de consultar.
  useEffect(() => {
    const temporizador = setTimeout(() => setBusca(texto.trim()), 350);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const linhas = useBuscaLinhas(busca);
  const abrir = (codigo: string) => router.push({ pathname: '/transporte/[linha]', params: { linha: codigo } });
  const buscando = busca.length >= 2;
  const resultados = linhas.data ?? [];

  return (
    <ScreenScroll titulo="Transporte" subtitulo="Veja os ônibus da linha ao vivo" comTabBar evitarTeclado>
      <OfflineBanner detalhe="As posições ao vivo precisam de internet." />
      <ViagemAtivaCard aoAbrirLinha={abrir} />

      <CustomInput
        rotulo="Linha de ônibus"
        icone="search-outline"
        placeholder="Número ou nome, ex.: 8700"
        value={texto}
        onChangeText={setTexto}
        ajuda="Digite pelo menos 2 caracteres."
        autoCapitalize="characters"
        autoCorrect={false}
        returnKeyType="search"
      />

      {buscando ? (
        <>
          <SectionTitle>Linhas</SectionTitle>
          <View accessibilityLiveRegion="polite">
            {linhas.isPending ? (
              <Card style={styles.carregando}>
                <Skeleton altura={20} largura="40%" />
                <Skeleton altura={16} largura="80%" />
              </Card>
            ) : linhas.isError ? (
              <Card semPadding>
                <ErrorMessage
                  compacto
                  mensagem={mensagemDeErro(linhas.error)}
                  aoTentarNovamente={() => void linhas.refetch()}
                  tentando={linhas.isRefetching}
                />
              </Card>
            ) : resultados.length === 0 ? (
              <Card semPadding>
                <EmptyState
                  icone="bus-outline"
                  titulo="Nenhuma linha encontrada"
                  descricao="Confira o número ou tente parte do nome da linha."
                />
              </Card>
            ) : (
              <Card semPadding>
                {resultados.map((linha, indice) => (
                  <ListRow
                    key={linha.codigo}
                    icone="bus-outline"
                    titulo={linha.codigo}
                    descricao={linha.nome}
                    divisor={indice < resultados.length - 1}
                    onPress={() => abrir(linha.codigo)}
                  />
                ))}
              </Card>
            )}
          </View>
        </>
      ) : (
        <Card style={styles.sobre}>
          <AppText variante="destaque">Como funciona</AppText>
          <AppText variante="subtitulo" cor="textoSecundario">
            Escolha uma linha para ver o trajeto oficial e onde estão os ônibus. As posições vêm da SPTrans e
            de passageiros que tocaram em &quot;Estou neste ônibus&quot;.
          </AppText>
          <AppText variante="subtitulo" cor="textoSecundario">
            Se o ônibus sair do trajeto, o app pergunta se a rota mudou e avisa quem usa a linha.
          </AppText>
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  carregando: { gap: espacos.sm },
  sobre: { gap: espacos.sm },
});
