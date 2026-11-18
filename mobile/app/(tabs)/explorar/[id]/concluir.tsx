import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Loading } from '@/components/feedback/Loading';
import { FotoPicker, type FotoSelecionada } from '@/components/ocorrencia/FotoPicker';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { useToast } from '@/context/ToastContext';
import { useOcorrencia } from '@/hooks/useOcorrencia';
import { ocorrenciaService, uploadService } from '@/services';
import { mensagemDeErro } from '@/services/erros';
import { chaves, queryClient } from '@/services/queryClient';
import { espacos } from '@/theme';
import type { FotoRef, OcorrenciaDetalhe } from '@/types/ocorrencia';
import { LIMITES } from '@/utils/validacoes';

function Formulario({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [feedback, setFeedback] = useState('');
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const concluir = async () => {
    setEnviando(true);
    try {
      const refs: FotoRef[] = [];
      for (const foto of fotos) {
        if (foto.local) refs.push({ path: (await uploadService.enviar(foto.local, 'ocorrencias')).path });
      }
      const texto = feedback.trim();
      const atualizada = await ocorrenciaService.concluir(ocorrencia.id, {
        feedback: texto.length > 0 ? texto : undefined,
        fotos: refs,
      });
      queryClient.setQueryData(chaves.ocorrencia(ocorrencia.id), atualizada);
      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
      setConfirmando(false);
      mostrarToast('Ocorrência concluída. Obrigado por avisar a comunidade!', 'sucesso');
      router.back();
    } catch (erro) {
      setConfirmando(false);
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Card style={styles.bloco}>
        <AppText variante="destaque">{ocorrencia.titulo}</AppText>
        <AppText variante="subtitulo" cor="textoSecundario">
          Ao concluir, a ocorrência sai da lista padrão e não aceita mais comentários nem participações.
          {ocorrencia.categoria === 'SEGURANCA'
            ? ' Relatos de Segurança não podem ser reabertos.'
            : ' Quem foi afetado pode reabri-la em até 7 dias.'}
        </AppText>
      </Card>

      {/* RN-ACO-05 */}
      <SectionTitle>Como terminou?</SectionTitle>
      <Card>
        <CustomInput
          rotulo="Feedback de finalização"
          multiline
          contador
          value={feedback}
          onChangeText={setFeedback}
          ajuda='Opcional. Ex.: "A Prefeitura tampou o buraco."'
          maxLength={LIMITES.feedbackMax}
          editable={!enviando}
        />
      </Card>

      <SectionTitle>Fotos</SectionTitle>
      <Card>
        <FotoPicker fotos={fotos} aoMudar={setFotos} disabled={enviando} />
      </Card>

      <CustomButton
        titulo="Marcar como concluída"
        icone="checkmark-circle-outline"
        onPress={() => setConfirmando(true)}
      />

      <ConfirmDialog
        visivel={confirmando}
        icone="checkmark-circle-outline"
        titulo="Concluir a ocorrência?"
        mensagem="O feedback aparece em destaque no topo da ocorrência para todos que acompanham."
        rotuloConfirmar="Concluir"
        aoConfirmar={() => void concluir()}
        aoCancelar={() => setConfirmando(false)}
        carregando={enviando}
      />
    </>
  );
}

/** Conclusão pelo autor, com feedback e fotos opcionais (RN-ACO-04, RN-ACO-05). */
export default function ConcluirOcorrenciaScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const consulta = useOcorrencia(id);
  const ocorrencia = consulta.data;

  return (
    <ScreenScroll titulo="Concluir ocorrência" aoVoltar={() => router.back()} evitarTeclado>
      {!ocorrencia ? (
        consulta.isError ? (
          <Card semPadding>
            <EmptyState
              icone="alert-circle-outline"
              titulo="Não foi possível abrir"
              descricao={mensagemDeErro(consulta.error)}
              rotuloAcao="Voltar"
              aoAgir={() => router.back()}
            />
          </Card>
        ) : (
          <Loading />
        )
      ) : ocorrencia.podeConcluir ? (
        <Formulario ocorrencia={ocorrencia} />
      ) : (
        <Card semPadding>
          <EmptyState
            icone="lock-closed-outline"
            titulo="Conclusão indisponível"
            descricao="Só quem registrou pode concluir, e apenas uma vez."
            rotuloAcao="Voltar"
            aoAgir={() => router.back()}
          />
        </Card>
      )}
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espacos.xs },
});
