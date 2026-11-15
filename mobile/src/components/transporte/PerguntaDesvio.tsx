import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/context/ToastContext';
import { useViagem } from '@/hooks/useViagem';
import { mensagemDeErro } from '@/services/erros';

/**
 * Pergunta global "O ônibus mudou de rota?" (RN-TAV-07) e aviso de viagem encerrada (RN-TAV-05).
 * Fica no layout raiz porque a viagem continua ativa em qualquer tela do app.
 */
export function PerguntaDesvio() {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const { viagem, desvioPendente, responderDesvio, ultimoFim, limparUltimoFim } = useViagem();
  const [respondendo, setRespondendo] = useState(false);

  useEffect(() => {
    if (!ultimoFim) return;
    mostrarToast(
      ultimoFim === 'EXPIRADA'
        ? 'Sua viagem terminou: o compartilhamento dura até 2 horas.'
        : 'Sua viagem foi encerrada e a localização não é mais compartilhada.',
    );
    limparUltimoFim();
  }, [ultimoFim, limparUltimoFim, mostrarToast]);

  const responder = async (confirmado: boolean) => {
    setRespondendo(true);
    try {
      const ocorrenciaId = await responderDesvio(confirmado);
      if (ocorrenciaId) {
        mostrarToast('Desvio registrado na ocorrência da linha. Obrigado por avisar!', 'sucesso');
        router.navigate({ pathname: '/explorar/[id]', params: { id: ocorrenciaId } });
      }
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setRespondendo(false);
    }
  };

  return (
    <ConfirmDialog
      visivel={desvioPendente !== null && viagem !== null}
      icone="git-branch-outline"
      titulo="O ônibus mudou de rota?"
      mensagem={
        viagem
          ? `A linha ${viagem.linha.codigo} parece estar fora do trajeto oficial. Se você confirmar, isso vira uma ocorrência "Alteração de rota sem aviso" para quem usa a linha.`
          : ''
      }
      rotuloConfirmar="Sim, mudou de rota"
      rotuloCancelar="Não, está no trajeto"
      aoConfirmar={() => void responder(true)}
      aoCancelar={() => void responder(false)}
      carregando={respondendo}
    />
  );
}
