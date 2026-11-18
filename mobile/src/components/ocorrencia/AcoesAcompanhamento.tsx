import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useToast } from '@/context/ToastContext';
import { ocorrenciaService } from '@/services';
import { mensagemDeErro } from '@/services/erros';
import { chaves, queryClient } from '@/services/queryClient';
import { espacos } from '@/theme';
import type { OcorrenciaDetalhe } from '@/types/ocorrencia';

/**
 * Ações de estado no detalhe: o autor conclui (RN-ACO-04) e quem foi afetado reabre
 * em até 7 dias (RN-ACO-07). Quem não pode fazer nenhuma das duas não vê o bloco.
 */
export function AcoesAcompanhamento({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [confirmando, setConfirmando] = useState(false);
  const [reabrindo, setReabrindo] = useState(false);

  if (!ocorrencia.podeConcluir && !ocorrencia.podeReabrir) return null;

  const reabrir = async () => {
    setReabrindo(true);
    try {
      const atualizada = await ocorrenciaService.reabrir(ocorrencia.id);
      queryClient.setQueryData(chaves.ocorrencia(ocorrencia.id), atualizada);
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
      mostrarToast('Ocorrência reaberta. Ela voltou para "Em acompanhamento".', 'sucesso');
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setReabrindo(false);
      setConfirmando(false);
    }
  };

  return (
    <>
      <SectionTitle>Acompanhamento</SectionTitle>
      <Card style={styles.bloco}>
        {ocorrencia.podeConcluir ? (
          <>
            <AppText variante="subtitulo" cor="textoSecundario">
              O problema foi resolvido? Só você, que registrou, pode marcar como concluída.
            </AppText>
            <CustomButton
              titulo="Marcar como concluída"
              icone="checkmark-circle-outline"
              variante="tonal"
              onPress={() =>
                router.push({ pathname: '/explorar/[id]/concluir', params: { id: ocorrencia.id } })
              }
            />
          </>
        ) : null}
        {ocorrencia.podeReabrir ? (
          <>
            <AppText variante="subtitulo" cor="textoSecundario">
              O problema continua? Como pessoa afetada, você pode reabrir em até 7 dias após a conclusão.
            </AppText>
            <CustomButton
              titulo="Reabrir ocorrência"
              icone="refresh-outline"
              variante="tonal"
              onPress={() => setConfirmando(true)}
            />
          </>
        ) : null}
      </Card>

      <ConfirmDialog
        visivel={confirmando}
        icone="refresh-outline"
        titulo="Reabrir a ocorrência?"
        mensagem='Ela volta para "Em acompanhamento" e aceita comentários e participações de novo.'
        rotuloConfirmar="Reabrir"
        aoConfirmar={() => void reabrir()}
        aoCancelar={() => setConfirmando(false)}
        carregando={reabrindo}
      />
    </>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espacos.md },
});
