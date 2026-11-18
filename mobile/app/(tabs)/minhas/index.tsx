import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthGate } from '@/components/auth/AuthGate';
import type { EmptyStateProps } from '@/components/feedback/EmptyState';
import { ListaOcorrencias } from '@/components/ocorrencia/ListaOcorrencias';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { CustomButton } from '@/components/ui/CustomButton';
import { LargeTitle } from '@/components/ui/LargeTitle';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SegmentedControl, type OpcaoSegmento } from '@/components/ui/SegmentedControl';
import { useTema } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { useCabecalhoRolavel, useEspacosTela } from '@/hooks/useCabecalhoRolavel';
import { useConectividade } from '@/hooks/useConectividade';
import { useEstadosOcorrencias } from '@/hooks/useEstadoOcorrenciaUsuario';
import { useFilaOffline } from '@/hooks/useFilaOffline';
import { idsComNovidade, useMinhasOcorrencias } from '@/hooks/useMinhasOcorrencias';
import { filaOffline, type ItemFila } from '@/services/offlineQueue';
import { chaves, queryClient } from '@/services/queryClient';
import { espacos } from '@/theme';
import type { AbaMinhas, OcorrenciaResumo } from '@/types/ocorrencia';
import { tempoRelativo } from '@/utils/formatarData';

const VAZIO: Record<AbaMinhas, Omit<EmptyStateProps, 'aoAgir'>> = {
  REGISTRADAS: {
    icone: 'create-outline',
    titulo: 'Você ainda não registrou nada',
    descricao: 'Viu um problema no seu bairro? Registre para a comunidade acompanhar.',
    rotuloAcao: 'Registrar ocorrência',
    iconeAcao: 'add',
  },
  AFETADO: {
    icone: 'people-outline',
    titulo: 'Nenhuma ocorrência afeta você',
    descricao: 'Quando marcar "Também estou sendo afetado" em uma ocorrência, ela aparece aqui.',
    rotuloAcao: 'Explorar ocorrências',
    iconeAcao: 'compass-outline',
  },
  APOIO: {
    icone: 'megaphone-outline',
    titulo: 'Você ainda não apoia nenhuma',
    descricao: 'Quando apoiar uma manifestação, ela aparece aqui.',
    rotuloAcao: 'Explorar ocorrências',
    iconeAcao: 'compass-outline',
  },
};

/** Identifica cada novidade (ocorrência + atividade), para saber quais o usuário já viu na aba. */
function marcasDeNovidade(ocorrencias: readonly OcorrenciaResumo[], ids: ReadonlySet<string>): string[] {
  return ocorrencias.filter((o) => ids.has(o.id)).map((o) => `${o.id}@${o.ultimaAtividadeEm}`);
}

/** Registros feitos sem conexão, ainda na fila (RN-GER-10). */
function RegistrosPendentes({ itens, uid }: { itens: readonly ItemFila[]; uid: string }) {
  const { cores } = useTema();
  const { online } = useConectividade();
  const [enviando, setEnviando] = useState(false);

  const registros = itens.filter((item) => item.acao.tipo === 'CRIAR_OCORRENCIA');
  if (registros.length === 0) return null;

  const tentar = async (id: string) => {
    filaOffline.tentarNovamente(id);
    setEnviando(true);
    try {
      const enviados = await filaOffline.processar(uid);
      if (enviados > 0) void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={styles.pendentes}>
      {registros.map((item) => {
        const comErro = item.status === 'ERRO';
        return (
          <Card key={item.id} style={styles.pendente}>
            <View style={styles.selos}>
              <Badge
                rotulo={comErro ? 'Não enviado' : item.status === 'ENVIANDO' ? 'Enviando' : 'Aguardando envio'}
                icone={comErro ? 'alert-circle-outline' : 'cloud-upload-outline'}
                cor={comErro ? cores.perigo : cores.alerta}
                fundo={comErro ? cores.perigoSuave : cores.alertaSuave}
                tamanho="pequeno"
              />
            </View>
            <AppText variante="destaque">
              {item.acao.tipo === 'CRIAR_OCORRENCIA' ? item.acao.resumo : ''}
            </AppText>
            <AppText variante="nota" cor="textoSecundario">
              {comErro
                ? (item.erro ?? 'O servidor recusou este registro.')
                : `Registrado ${tempoRelativo(item.criadoEm)}. Será enviado quando a internet voltar.`}
            </AppText>
            {comErro ? (
              <View style={styles.acoes}>
                <CustomButton
                  titulo="Tentar novamente"
                  variante="tonal"
                  tamanho="medio"
                  larguraTotal={false}
                  style={styles.acao}
                  onPress={() => void tentar(item.id)}
                  carregando={enviando}
                  disabled={!online}
                />
                <CustomButton
                  titulo="Descartar"
                  variante="perigo"
                  tamanho="medio"
                  larguraTotal={false}
                  style={styles.acao}
                  onPress={() => filaOffline.remover(item.id)}
                  disabled={enviando}
                />
              </View>
            ) : null}
          </Card>
        );
      })}
    </View>
  );
}

function Minhas({ uid }: { uid: string }) {
  const router = useRouter();
  const { scrollY, aoRolar } = useCabecalhoRolavel();
  const { topo, base } = useEspacosTela({ comTabBar: true });
  const [aba, setAba] = useState<AbaMinhas>('REGISTRADAS');

  // As três abas são carregadas para o ponto de "novidade" aparecer em cada uma.
  const registradas = useMinhasOcorrencias('REGISTRADAS', true);
  const afetado = useMinhasOcorrencias('AFETADO', true);
  const apoio = useMinhasOcorrencias('APOIO', true);
  const estados = useEstadosOcorrencias(uid);
  const fila = useFilaOffline(uid);

  const novidades = useMemo(
    () => ({
      REGISTRADAS: idsComNovidade(registradas.ocorrencias, estados.data),
      AFETADO: idsComNovidade(afetado.ocorrencias, estados.data),
      APOIO: idsComNovidade(apoio.ocorrencias, estados.data),
    }),
    [registradas.ocorrencias, afetado.ocorrencias, apoio.ocorrencias, estados.data],
  );

  // O ponto da aba some quando ela é aberta: a aba aberta nunca mostra o ponto e, ao sair dela,
  // as novidades que estavam na lista ficam como vistas. O selo de cada ocorrência continua até
  // ela ser aberta (RN-MIN-04).
  const [vistasNaAba, setVistasNaAba] = useState<ReadonlySet<string>>(() => new Set());
  const marcas: Record<AbaMinhas, string[]> = {
    REGISTRADAS: marcasDeNovidade(registradas.ocorrencias, novidades.REGISTRADAS),
    AFETADO: marcasDeNovidade(afetado.ocorrencias, novidades.AFETADO),
    APOIO: marcasDeNovidade(apoio.ocorrencias, novidades.APOIO),
  };
  const temPonto = (alvo: AbaMinhas) => alvo !== aba && marcas[alvo].some((marca) => !vistasNaAba.has(marca));

  const mudarAba = (nova: AbaMinhas) => {
    setVistasNaAba((atual) => new Set([...atual, ...marcas[aba]]));
    setAba(nova);
  };

  const opcoes: OpcaoSegmento<AbaMinhas>[] = [
    { valor: 'REGISTRADAS', rotulo: 'Registradas por mim', novidade: temPonto('REGISTRADAS') },
    { valor: 'AFETADO', rotulo: 'Sou afetado', novidade: temPonto('AFETADO') },
    { valor: 'APOIO', rotulo: 'Apoio', novidade: temPonto('APOIO') },
  ];

  const lista = aba === 'REGISTRADAS' ? registradas : aba === 'AFETADO' ? afetado : apoio;

  const idsAguardando = new Set(
    fila.itens.flatMap((item) => (item.acao.tipo === 'CRIAR_OCORRENCIA' ? [] : [item.acao.ocorrenciaId])),
  );

  const abrir = useCallback(
    (id: string) => router.push({ pathname: '/explorar/[id]', params: { id } }),
    [router],
  );

  return (
    <Screen sobreposicao={<ScreenHeader titulo="Minhas" scrollY={scrollY} />}>
      <ListaOcorrencias
        ocorrencias={lista.ocorrencias}
        carregando={lista.carregando}
        erro={lista.erro}
        atualizando={lista.atualizando}
        pausada={lista.pausada}
        aoRecarregar={() => Promise.all([lista.recarregar(), estados.refetch()])}
        aoAbrir={abrir}
        temMais={lista.temMais}
        carregandoMais={lista.carregandoMais}
        aoCarregarMais={lista.carregarMais}
        idsComNovidade={novidades[aba]}
        idsAguardandoEnvio={idsAguardando}
        recuoTopo={topo}
        recuoBase={base}
        aoRolar={aoRolar}
        cabecalho={
          <View style={styles.cabecalho}>
            <LargeTitle titulo="Minhas" subtitulo="O que você registrou e acompanha" scrollY={scrollY} />
            <SegmentedControl rotulo="Abas de Minhas ocorrências" opcoes={opcoes} valor={aba} aoMudar={mudarAba} />
            {aba === 'REGISTRADAS' ? <RegistrosPendentes itens={fila.itens} uid={uid} /> : null}
          </View>
        }
        vazio={{
          ...VAZIO[aba],
          aoAgir: () => router.navigate(aba === 'REGISTRADAS' ? '/registrar' : '/explorar'),
        }}
      />
    </Screen>
  );
}

/** Minhas ocorrências: registradas por mim, sou afetado e apoio (RN-MIN-01 a 04). */
export default function MinhasScreen() {
  return (
    <AuthGate
      titulo="Minhas"
      comTabBar
      icone="bookmark-outline"
      descricao="Entre para acompanhar as ocorrências que você registrou, as que afetam você e as que apoia.">
      <MinhasComSessao />
    </AuthGate>
  );
}

function MinhasComSessao() {
  const { usuario } = useAuth();
  return usuario ? <Minhas key={usuario.uid} uid={usuario.uid} /> : null;
}

const styles = StyleSheet.create({
  cabecalho: { gap: espacos.md },
  pendentes: { gap: espacos.md },
  pendente: { gap: espacos.sm },
  selos: { flexDirection: 'row' },
  acoes: { flexDirection: 'row', gap: espacos.sm },
  acao: { flex: 1, alignSelf: 'auto' },
});
