import { useQuery } from '@tanstack/react-query';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { OcorrenciaCard } from '@/components/ocorrencia/OcorrenciaCard';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { useRegistro } from '@/context/RegistroContext';
import { useToast } from '@/context/ToastContext';
import { useParticipacao } from '@/hooks/useParticipacao';
import { ocorrenciaService } from '@/services';
import { mensagemDeErro } from '@/services/erros';
import { chaves, queryClient } from '@/services/queryClient';
import { espacos } from '@/theme';
import type { OcorrenciaSemelhante, TipoParticipacao } from '@/types/ocorrencia';
import { montarBusca } from '@/utils/registro';

function Sugestao({ ocorrencia, aoAbrir }: { ocorrencia: OcorrenciaSemelhante; aoAbrir: (id: string) => void }) {
  const { mostrarToast } = useToast();
  const participacao = useParticipacao(ocorrencia.id);
  const [emAndamento, setEmAndamento] = useState<TipoParticipacao | null>(null);
  const [confirmandoApoio, setConfirmandoApoio] = useState(false);

  const minha = ocorrencia.minhaParticipacao;
  const autor = minha?.autor ?? false;

  const participar = async (tipo: TipoParticipacao) => {
    setConfirmandoApoio(false);
    setEmAndamento(tipo);
    try {
      const envio = await participacao.mutateAsync({ tipo, marcar: true });
      // A lista de sugestões passa a mostrar "Você já participa" (RN-SEM-07).
      void queryClient.invalidateQueries({ queryKey: ['semelhantes'] });
      mostrarToast(
        envio.enfileirada
          ? 'Sem conexão. Sua participação será enviada quando a internet voltar.'
          : tipo === 'afetado'
            ? 'Você foi contado como afetado. Acompanhe em Minhas.'
            : 'Apoio registrado. Acompanhe em Minhas.',
        envio.enfileirada ? 'info' : 'sucesso',
      );
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setEmAndamento(null);
    }
  };

  return (
    <View style={styles.sugestao}>
      <OcorrenciaCard ocorrencia={ocorrencia} onPress={aoAbrir} distanciaMetros={ocorrencia.distanciaMetros} />
      {/* RN-SEM-06: participar direto pela sugestão. O autor já conta como afetado (RN-PAR-03). */}
      {autor ? null : (
        <View style={styles.acoes}>
          {minha?.afetado ? null : (
            <CustomButton
              titulo="Também sou afetado"
              rotuloAcessivel={`Também estou sendo afetado por: ${ocorrencia.titulo}`}
              icone="people-outline"
              tamanho="medio"
              larguraTotal={false}
              style={styles.acao}
              onPress={() => void participar('afetado')}
              carregando={emAndamento === 'afetado'}
              disabled={emAndamento !== null}
            />
          )}
          {minha?.apoio ? null : (
            <CustomButton
              titulo="Apoiar"
              rotuloAcessivel={`Apoiar: ${ocorrencia.titulo}`}
              icone="megaphone-outline"
              variante="contorno"
              tamanho="medio"
              larguraTotal={false}
              style={styles.acao}
              onPress={() => setConfirmandoApoio(true)}
              carregando={emAndamento === 'apoio'}
              disabled={emAndamento !== null}
            />
          )}
        </View>
      )}

      <ConfirmDialog
        visivel={confirmandoApoio}
        icone="megaphone-outline"
        titulo="Apoiar esta manifestação?"
        mensagem="Seu nome vai aparecer na lista pública de apoiadores desta ocorrência."
        rotuloConfirmar="Apoiar"
        aoConfirmar={() => void participar('apoio')}
        aoCancelar={() => setConfirmandoApoio(false)}
      />
    </View>
  );
}

/** Registrar, passo 2: ocorrências semelhantes antes de criar uma nova (RN-SEM-01 a 08). */
export default function SemelhantesScreen() {
  const router = useRouter();
  const { categoria, valores, local } = useRegistro();
  const busca = montarBusca(categoria, valores, local);

  const consulta = useQuery({
    queryKey: busca ? chaves.semelhantes(busca) : ['semelhantes', 'sem-rascunho'],
    queryFn: () => (busca ? ocorrenciaService.semelhantes(busca) : Promise.resolve([])),
    enabled: busca !== null,
    staleTime: 30 * 1000,
  });

  // Sem rascunho (ex.: app reaberto direto nesta tela): volta ao primeiro passo.
  if (!busca) return <Redirect href="/registrar" />;

  const criarNova = () => router.push('/registrar/detalhes');
  const abrir = (id: string) => router.push({ pathname: '/explorar/[id]', params: { id } });
  const sugestoes = consulta.data ?? [];

  return (
    <ScreenScroll
      titulo="Já existe algo parecido?"
      subtitulo="Somar a uma ocorrência existente dá mais força ao relato"
      aoVoltar={() => router.back()}>
      {consulta.isPending ? (
        <SkeletonList quantidade={2} />
      ) : consulta.isError ? (
        <Card semPadding>
          <ErrorMessage
            compacto
            mensagem="Não foi possível buscar ocorrências parecidas. Você pode criar a sua normalmente."
            aoTentarNovamente={() => void consulta.refetch()}
            tentando={consulta.isRefetching}
          />
        </Card>
      ) : sugestoes.length === 0 ? (
        <Card>
          <AppText variante="subtitulo" cor="textoSecundario">
            Nenhuma ocorrência parecida por perto. Siga para criar a sua.
          </AppText>
        </Card>
      ) : (
        sugestoes.map((ocorrencia) => (
          <Sugestao key={ocorrencia.id} ocorrencia={ocorrencia} aoAbrir={abrir} />
        ))
      )}

      {/* RN-SEM-08: a sugestão nunca bloqueia a criação. */}
      <CustomButton
        titulo="Não é o meu caso, criar nova"
        icone="add"
        variante={sugestoes.length > 0 ? 'tonal' : 'primario'}
        onPress={criarNova}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  sugestao: { gap: espacos.sm },
  acoes: { flexDirection: 'row', gap: espacos.sm },
  acao: { flex: 1, alignSelf: 'auto' },
});
