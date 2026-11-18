import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { MiniMapa } from '@/components/mapa/MiniMapa';
import { AcoesAcompanhamento } from '@/components/ocorrencia/AcoesAcompanhamento';
import { BotoesParticipacao } from '@/components/ocorrencia/BotoesParticipacao';
import { CategoriaBadge } from '@/components/ocorrencia/CategoriaBadge';
import { ContagemParticipacao } from '@/components/ocorrencia/ContagemParticipacao';
import { DenunciaSheet, type AlvoDenuncia } from '@/components/ocorrencia/DenunciaSheet';
import { EstadoBadge } from '@/components/ocorrencia/EstadoBadge';
import { GaleriaFotos } from '@/components/ocorrencia/GaleriaFotos';
import { LinhaDoTempo } from '@/components/ocorrencia/LinhaDoTempo';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { AVISO_SEGURANCA } from '@/config/formularios';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useEstadoOcorrenciaUsuario } from '@/hooks/useEstadoOcorrenciaUsuario';
import { pendentesDaOcorrencia, useFilaOffline } from '@/hooks/useFilaOffline';
import { useOcorrenciaAoVivo } from '@/hooks/useTempoReal';
import { useApoiadores, useLinhaDoTempo, useOcorrencia } from '@/hooks/useOcorrencia';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { OcorrenciaDetalhe } from '@/types/ocorrencia';
import { formatarDataHora, tempoRelativo } from '@/utils/formatarData';

function Conclusao({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  const { conclusao, concluidaEm } = ocorrencia;
  if (!conclusao) return null;

  return (
    // RN-ACO-05: o feedback de finalização fica em destaque no topo.
    <Card style={styles.bloco}>
      <View style={styles.linha}>
        <Icon nome="checkmark-circle" tamanho={22} cor="sucesso" />
        <AppText variante="destaque" style={styles.flex}>
          {conclusao.motivo === 'AUTOR' ? 'Concluída por quem registrou' : 'Encerrada por inatividade'}
        </AppText>
      </View>
      {concluidaEm ? (
        <AppText variante="nota" cor="textoTerciario">
          {formatarDataHora(concluidaEm)}
        </AppText>
      ) : null}
      {conclusao.feedback ? <AppText variante="corpo">{conclusao.feedback}</AppText> : null}
      <GaleriaFotos fotos={conclusao.fotos} contexto="da conclusão" />
    </Card>
  );
}

function Apoiadores({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  // RN-PAR-07: em Segurança nenhuma lista é exibida; a de afetados nunca aparece.
  const visivel = ocorrencia.categoria !== 'SEGURANCA' && ocorrencia.totalApoios > 0;
  const apoiadores = useApoiadores(ocorrencia.id, visivel);
  if (!visivel || !apoiadores.data || apoiadores.data.items.length === 0) return null;

  const nomes = apoiadores.data.items.map((apoiador) => apoiador.nome);
  const restantes = apoiadores.data.total - nomes.length;

  return (
    <>
      <SectionTitle>Quem apoia</SectionTitle>
      <Card style={styles.bloco}>
        <AppText variante="subtitulo">
          {nomes.join(', ')}
          {restantes > 0 ? ` e mais ${restantes}` : ''}
        </AppText>
        <AppText variante="nota" cor="textoTerciario">
          Só o nome público aparece. A lista de afetados não é exibida.
        </AppText>
      </Card>
    </>
  );
}

function Detalhe({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  const router = useRouter();
  const { cores } = useTema();
  const { usuario } = useAuth();
  const fila = useFilaOffline(usuario?.uid ?? null);
  const linhaDoTempo = useLinhaDoTempo(ocorrencia.id);
  const [denuncia, setDenuncia] = useState<AlvoDenuncia | null>(null);

  const pendentes = pendentesDaOcorrencia(fila.itens, ocorrencia.id);
  // Rua e bairro podem faltar quando a geocodificação falhou (doc 10): mostra só o que houver.
  const local = [ocorrencia.rua, ocorrencia.bairro].filter(Boolean).join(', ') || 'Localização aproximada';

  return (
    <>
      <OfflineBanner detalhe="Mostrando os últimos dados carregados desta ocorrência." />

      {ocorrencia.oculta ? (
        <Card style={styles.linha}>
          <Icon nome="eye-off-outline" tamanho={22} cor="alerta" />
          <AppText variante="subtitulo" style={styles.flex}>
            Esta ocorrência está oculta para outras pessoas até a revisão da equipe Colecity.
          </AppText>
        </Card>
      ) : null}

      <Conclusao ocorrencia={ocorrencia} />

      <Card style={styles.bloco}>
        <View style={styles.selos}>
          <CategoriaBadge categoria={ocorrencia.categoria} />
          <EstadoBadge estado={ocorrencia.estado} />
          {ocorrencia.zonaAtencao ? (
            <Badge
              rotulo="Zona de atenção"
              icone="alert-circle-outline"
              cor={cores.perigo}
              fundo={cores.perigoSuave}
            />
          ) : null}
        </View>
        <AppText variante="titulo2" accessibilityRole="header">
          {ocorrencia.titulo}
        </AppText>
        <AppText variante="nota" cor="textoSecundario">
          Registrada por {ocorrencia.autor.removido ? 'Usuário removido' : ocorrencia.autor.nome} em{' '}
          {formatarDataHora(ocorrencia.criadaEm)} · atualizada {tempoRelativo(ocorrencia.ultimaAtividadeEm)}
        </AppText>
        <AppText variante="corpo" selectable>
          {ocorrencia.descricao}
        </AppText>
        {ocorrencia.linha ? (
          <View style={styles.linha}>
            <Icon nome="bus-outline" tamanho={18} cor="textoSecundario" />
            <AppText variante="subtitulo" style={styles.flex}>
              Linha {ocorrencia.linha.codigo} · {ocorrencia.linha.nome}
            </AppText>
          </View>
        ) : null}
        {ocorrencia.dataHoraOcorrido ? (
          <View style={styles.linha}>
            <Icon nome="time-outline" tamanho={18} cor="textoSecundario" />
            <AppText variante="subtitulo" style={styles.flex}>
              Ocorrido em {formatarDataHora(ocorrencia.dataHoraOcorrido)}
            </AppText>
          </View>
        ) : null}
        <GaleriaFotos
          fotos={ocorrencia.fotos}
          contexto="da ocorrência"
          aoDenunciar={usuario ? (foto) => setDenuncia({ tipoConteudo: 'FOTO', conteudoId: foto.id }) : undefined}
        />
      </Card>

      {ocorrencia.categoria === 'SEGURANCA' ? (
        <Card style={styles.linha}>
          <Icon nome="call-outline" tamanho={22} cor="perigo" />
          <AppText variante="subtitulo" style={styles.flex}>
            {AVISO_SEGURANCA}
          </AppText>
        </Card>
      ) : null}

      <SectionTitle>Participação</SectionTitle>
      <Card style={styles.bloco}>
        <ContagemParticipacao
          totalAfetados={ocorrencia.totalAfetados}
          totalApoios={ocorrencia.totalApoios}
          tamanho="destaque"
        />
        {/* RN-CSL-07 */}
        <AppText variante="nota" cor="textoTerciario">
          {ocorrencia.avisoContagem}
        </AppText>
        <BotoesParticipacao
          ocorrencia={ocorrencia}
          aguardandoEnvio={pendentes.some((item) => item.acao.tipo === 'PARTICIPAR')}
        />
      </Card>

      <Apoiadores ocorrencia={ocorrencia} />

      <AcoesAcompanhamento ocorrencia={ocorrencia} />

      <SectionTitle>Conversa</SectionTitle>
      <Card semPadding>
        <ListRow
          icone="chatbubbles-outline"
          titulo="Comentários"
          descricao={
            ocorrencia.estado === 'CONCLUIDA'
              ? 'Leia o que a comunidade comentou.'
              : 'Leia e comente com quem acompanha esta ocorrência.'
          }
          onPress={() => router.push({ pathname: '/explorar/[id]/comentarios', params: { id: ocorrencia.id } })}
        />
      </Card>

      <SectionTitle>Localização aproximada</SectionTitle>
      <Card style={styles.bloco}>
        <MiniMapa centro={ocorrencia.localizacaoAproximada} descricao={local} />
        <View style={styles.linha}>
          <Icon nome="location-outline" tamanho={18} cor="textoSecundario" />
          <AppText variante="subtitulo" style={styles.flex}>
            {local}
          </AppText>
        </View>
        {/* RN-CSL-08 */}
        <AppText variante="nota" cor="textoTerciario">
          O círculo mostra uma área de cerca de 100 m, não o ponto exato.
        </AppText>
      </Card>

      <SectionTitle>Linha do tempo</SectionTitle>
      <Card>
        {linhaDoTempo.data ? (
          <LinhaDoTempo eventos={linhaDoTempo.data} />
        ) : linhaDoTempo.isError ? (
          <ErrorMessage
            compacto
            mensagem={mensagemDeErro(linhaDoTempo.error)}
            aoTentarNovamente={() => void linhaDoTempo.refetch()}
          />
        ) : (
          <AppText variante="subtitulo" cor="textoSecundario">
            Carregando a linha do tempo…
          </AppText>
        )}
      </Card>

      <DenunciaSheet alvo={denuncia} aoFechar={() => setDenuncia(null)} />
    </>
  );
}

/** Detalhe da ocorrência (RN-CSL-06 a 08), aberto a visitantes. */
export default function OcorrenciaScreen() {
  const router = useRouter();
  const { cores } = useTema();
  const { mostrarToast } = useToast();
  const { usuario } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const consulta = useOcorrencia(id ?? '');
  const estadoUsuario = useEstadoOcorrenciaUsuario(usuario?.uid ?? null, id ?? '');
  useOcorrenciaAoVivo(id ?? '');

  const [acoesAbertas, setAcoesAbertas] = useState(false);
  const [denuncia, setDenuncia] = useState<AlvoDenuncia | null>(null);

  const ocorrencia = consulta.data;
  const voltar = () => (router.canGoBack() ? router.back() : router.replace('/explorar'));

  const alternarSilencio = async () => {
    setAcoesAbertas(false);
    const silenciar = !estadoUsuario.silenciada;
    try {
      await estadoUsuario.definirSilenciada(silenciar);
      mostrarToast(
        silenciar
          ? 'Notificações desta ocorrência silenciadas.'
          : 'Notificações desta ocorrência reativadas.',
        'sucesso',
      );
    } catch {
      mostrarToast('Não foi possível salvar. Tente novamente.', 'erro');
    }
  };

  const naoEncontrada = ehErroApi(consulta.error) && consulta.error.code === 'NAO_ENCONTRADO';

  return (
    <ScreenScroll
      titulo="Ocorrência"
      aoVoltar={voltar}
      direita={
        ocorrencia && usuario ? (
          <IconButton
            icone="ellipsis-horizontal"
            rotulo="Mais ações"
            onPress={() => setAcoesAbertas(true)}
          />
        ) : undefined
      }
      refreshControl={
        <RefreshControl
          refreshing={consulta.isRefetching}
          onRefresh={() => void consulta.refetch()}
          tintColor={cores.primaria}
          colors={[cores.primaria]}
        />
      }>
      {ocorrencia ? (
        <Detalhe ocorrencia={ocorrencia} />
      ) : consulta.fetchStatus === 'paused' ? (
        <Card semPadding>
          <EmptyState
            icone="cloud-offline-outline"
            titulo="Sem conexão"
            descricao="Conecte-se à internet para abrir esta ocorrência."
            rotuloAcao="Tentar novamente"
            iconeAcao="refresh-outline"
            aoAgir={() => void consulta.refetch()}
          />
        </Card>
      ) : naoEncontrada ? (
        <Card semPadding>
          <EmptyState
            icone="help-circle-outline"
            titulo="Ocorrência não encontrada"
            descricao="Ela pode ter sido removida ou estar oculta para revisão."
            rotuloAcao="Voltar"
            aoAgir={voltar}
          />
        </Card>
      ) : consulta.isError ? (
        <Card semPadding>
          <ErrorMessage
            mensagem={mensagemDeErro(consulta.error)}
            aoTentarNovamente={() => void consulta.refetch()}
            tentando={consulta.isRefetching}
          />
        </Card>
      ) : (
        <SkeletonList quantidade={3} />
      )}

      <BottomSheet visivel={acoesAbertas} aoFechar={() => setAcoesAbertas(false)} titulo="Mais ações">
        <Card semPadding>
          {ocorrencia?.podeEditar ? (
            <ListRow
              icone="create-outline"
              titulo="Editar descrição e fotos"
              divisor
              onPress={() => {
                setAcoesAbertas(false);
                router.push({ pathname: '/explorar/[id]/editar', params: { id: ocorrencia.id } });
              }}
            />
          ) : null}
          <ListRow
            icone={estadoUsuario.silenciada ? 'notifications-outline' : 'notifications-off-outline'}
            titulo={estadoUsuario.silenciada ? 'Reativar notificações' : 'Silenciar notificações'}
            descricao="Vale só para esta ocorrência."
            seta={false}
            divisor
            onPress={() => void alternarSilencio()}
          />
          <ListRow
            icone="flag-outline"
            titulo="Denunciar ocorrência"
            cor="perigo"
            seta={false}
            onPress={() => {
              setAcoesAbertas(false);
              // Espera o painel fechar: o iOS não abre um modal enquanto outro está saindo.
              if (ocorrencia) {
                const alvo: AlvoDenuncia = { tipoConteudo: 'OCORRENCIA', conteudoId: ocorrencia.id };
                setTimeout(() => setDenuncia(alvo), 350);
              }
            }}
          />
        </Card>
      </BottomSheet>

      <DenunciaSheet alvo={denuncia} aoFechar={() => setDenuncia(null)} />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espacos.md },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.xs },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espacos.sm },
  flex: { flex: 1 },
});
