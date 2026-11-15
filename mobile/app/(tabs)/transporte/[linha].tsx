import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { MapaLinha, nomeFonte } from '@/components/transporte/MapaLinha';
import { ViagemAtivaCard } from '@/components/transporte/ViagemAtivaCard';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { SegmentedControl, type OpcaoSegmento } from '@/components/ui/SegmentedControl';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useLinha, useTrajeto, useVeiculos, useViagem } from '@/hooks/useViagem';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { Linha, Veiculo } from '@/types/transporte';
import { tempoRelativo } from '@/utils/formatarData';

type ChaveSentido = '1' | '2';

function ItemVeiculo({ veiculo, divisor }: { veiculo: Veiculo; divisor: boolean }) {
  const { cores } = useTema();
  const sptrans = veiculo.fonte === 'SPTRANS';
  const acessivel =
    veiculo.acessivel === true ? 'Acessível' : veiculo.acessivel === false ? 'Sem acessibilidade informada' : null;

  return (
    <View
      accessible
      accessibilityLabel={[
        sptrans ? `Ônibus ${veiculo.prefixo ?? ''}` : 'Ônibus',
        nomeFonte(veiculo),
        acessivel,
        `Atualizado ${tempoRelativo(veiculo.atualizadoEm)}`,
      ]
        .filter(Boolean)
        .join('. ')}
      style={[
        styles.veiculo,
        divisor && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: cores.divisor },
      ]}>
      <View style={[styles.icone, { backgroundColor: sptrans ? cores.primaria : cores.afetados }]}>
        <Icon nome={sptrans ? 'bus' : 'people'} tamanho={16} corCustom={cores.textoInverso} />
      </View>
      <View style={styles.flex}>
        <AppText variante="chamada">{sptrans ? `Ônibus ${veiculo.prefixo ?? ''}` : 'Ônibus'}</AppText>
        {/* RN-TAV-03 / RN-TAV-04: a origem da posição sempre aparece em texto. */}
        <AppText variante="nota" cor="textoSecundario">
          {nomeFonte(veiculo)}
          {acessivel ? ` · ${acessivel}` : ''}
        </AppText>
      </View>
      <AppText variante="nota" cor="textoTerciario">
        {tempoRelativo(veiculo.atualizadoEm)}
      </AppText>
    </View>
  );
}

function DetalheLinha({ linha }: { linha: Linha }) {
  const router = useRouter();
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const { viagem, desvioPendente, iniciar } = useViagem();

  const [sentido, setSentido] = useState<1 | 2>(viagem?.linha.codigo === linha.codigo ? viagem.sentido : 1);
  const [confirmando, setConfirmando] = useState(false);
  const [iniciando, setIniciando] = useState(false);

  const trajeto = useTrajeto(linha.codigo, sentido);
  const veiculos = useVeiculos(linha.codigo, sentido);

  const opcoes: OpcaoSegmento<ChaveSentido>[] = linha.sentidos.map((item) => ({
    valor: String(item.sentido) as ChaveSentido,
    rotulo: `Para ${item.destino}`,
  }));
  const destino = linha.sentidos.find((item) => item.sentido === sentido)?.destino ?? '';

  const nestaLinha = viagem?.linha.codigo === linha.codigo && viagem.sentido === sentido;
  const lista = veiculos.data ?? [];

  const comecar = async () => {
    setIniciando(true);
    try {
      const resultado = await iniciar({ codigo: linha.codigo, nome: linha.nome }, sentido, destino);
      setConfirmando(false);
      mostrarToast(
        resultado === 'INICIADA'
          ? 'Viagem iniciada. Obrigado por ajudar quem espera este ônibus!'
          : 'Sem acesso à localização não é possível compartilhar a viagem.',
        resultado === 'INICIADA' ? 'sucesso' : 'erro',
      );
    } catch (erro) {
      setConfirmando(false);
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setIniciando(false);
    }
  };

  return (
    <>
      <OfflineBanner detalhe="As posições ao vivo precisam de internet." />

      {opcoes.length > 1 ? (
        <SegmentedControl
          rotulo="Sentido da linha"
          opcoes={opcoes}
          valor={String(sentido) as ChaveSentido}
          aoMudar={(valor) => setSentido(valor === '1' ? 1 : 2)}
        />
      ) : null}

      <MapaLinha
        trajeto={trajeto.data?.pontos ?? []}
        veiculos={lista}
        trechoDesvio={nestaLinha ? desvioPendente : null}
        descricao={`Mapa da linha ${linha.codigo}, sentido ${destino}`}
      />
      {trajeto.isError ? (
        <Card semPadding>
          <ErrorMessage
            compacto
            mensagem="Não foi possível carregar o trajeto da linha."
            aoTentarNovamente={() => void trajeto.refetch()}
            tentando={trajeto.isRefetching}
          />
        </Card>
      ) : null}

      {viagem ? (
        <ViagemAtivaCard
          aoAbrirLinha={
            viagem.linha.codigo === linha.codigo
              ? undefined
              : (codigo) => router.replace({ pathname: '/transporte/[linha]', params: { linha: codigo } })
          }
        />
      ) : null}

      {nestaLinha ? null : (
        <Card style={styles.bloco}>
          <AppText variante="subtitulo" cor="textoSecundario">
            Está dentro de um ônibus desta linha? Compartilhe a viagem para quem está no ponto saber onde ele
            está.
          </AppText>
          <CustomButton
            titulo="Estou neste ônibus"
            icone="bus-outline"
            onPress={() => (usuario ? setConfirmando(true) : router.push('/login'))}
          />
          {usuario ? null : (
            <AppText variante="nota" cor="textoTerciario">
              É preciso entrar na sua conta para compartilhar a viagem.
            </AppText>
          )}
        </Card>
      )}

      <SectionTitle>Ônibus nesta linha</SectionTitle>
      {veiculos.isPending ? (
        <SkeletonList quantidade={2} />
      ) : veiculos.isError ? (
        <Card semPadding>
          <ErrorMessage
            compacto
            mensagem={mensagemDeErro(veiculos.error)}
            aoTentarNovamente={() => void veiculos.refetch()}
            tentando={veiculos.isRefetching}
          />
        </Card>
      ) : lista.length === 0 ? (
        <Card semPadding>
          <EmptyState
            icone="bus-outline"
            titulo="Nenhum ônibus localizado agora"
            descricao="As posições são atualizadas automaticamente."
          />
        </Card>
      ) : (
        <Card semPadding>
          {lista.map((veiculo, indice) => (
            <ItemVeiculo
              key={`${veiculo.fonte}-${veiculo.prefixo ?? indice}`}
              veiculo={veiculo}
              divisor={indice < lista.length - 1}
            />
          ))}
        </Card>
      )}

      <AppText variante="nota" cor="textoTerciario">
        Linha azul: trajeto oficial. Ícone de ônibus: posição da SPTrans. Ícone de pessoas: relatado por
        passageiros. A lista é atualizada a cada 15 segundos.
      </AppText>

      <ConfirmDialog
        visivel={confirmando}
        icone="bus-outline"
        titulo={`Compartilhar a viagem na linha ${linha.codigo}?`}
        mensagem={
          (viagem ? 'Sua viagem atual será encerrada. ' : '') +
          `Sentido ${destino}. O app envia a sua localização só com ele aberto, por até 2 horas ou até você encerrar. No mapa aparece apenas o ônibus, nunca o seu nome.`
        }
        rotuloConfirmar="Compartilhar"
        aoConfirmar={() => void comecar()}
        aoCancelar={() => setConfirmando(false)}
        carregando={iniciando}
      />
    </>
  );
}

/** Linha ao vivo: trajeto oficial, ônibus e "Estou neste ônibus" (RN-TAV-02 a 07). */
export default function LinhaScreen() {
  const router = useRouter();
  const { linha: codigo = '' } = useLocalSearchParams<{ linha: string }>();
  const consulta = useLinha(codigo);
  const linha = consulta.data;
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/transporte'));

  return (
    <ScreenScroll titulo={`Linha ${codigo}`} subtitulo={linha?.nome} aoVoltar={voltar}>
      {linha ? (
        <DetalheLinha key={linha.codigo} linha={linha} />
      ) : consulta.isPending && consulta.fetchStatus !== 'paused' ? (
        <SkeletonList quantidade={2} />
      ) : consulta.isError ? (
        <Card semPadding>
          <ErrorMessage
            mensagem={mensagemDeErro(consulta.error)}
            aoTentarNovamente={() => void consulta.refetch()}
            tentando={consulta.isRefetching}
          />
        </Card>
      ) : consulta.fetchStatus === 'paused' ? (
        <Card semPadding>
          <EmptyState
            icone="cloud-offline-outline"
            titulo="Sem conexão"
            descricao="Conecte-se à internet para ver a linha ao vivo."
          />
        </Card>
      ) : (
        <Card semPadding>
          <EmptyState
            icone="bus-outline"
            titulo="Linha não encontrada"
            descricao="Volte e busque a linha pelo número ou pelo nome."
            rotuloAcao="Buscar linha"
            aoAgir={voltar}
          />
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espacos.md },
  veiculo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.md,
    paddingVertical: espacos.md,
    paddingHorizontal: espacos.lg,
  },
  icone: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  flex: { flex: 1, gap: espacos.xxs },
});
