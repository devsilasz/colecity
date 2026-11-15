import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useParticipacao } from '@/hooks/useParticipacao';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { OcorrenciaDetalhe, TipoParticipacao } from '@/types/ocorrencia';

interface Pedido {
  tipo: TipoParticipacao;
  marcar: boolean;
}

interface TextoConfirmacao {
  titulo: string;
  mensagem: string;
  confirmar: string;
}

function textoConfirmacao({ tipo, marcar }: Pedido): TextoConfirmacao {
  if (marcar) {
    // RN-PAR-06: ao apoiar, avisar que o nome aparece na lista.
    return {
      titulo: 'Apoiar esta manifestação?',
      mensagem: 'Seu nome vai aparecer na lista pública de apoiadores desta ocorrência.',
      confirmar: 'Apoiar',
    };
  }
  return tipo === 'afetado'
    ? {
        titulo: 'Não está mais sendo afetado?',
        mensagem: 'Você deixa de contar como afetado e a ocorrência sai da sua lista "Sou afetado".',
        confirmar: 'Retirar',
      }
    : {
        titulo: 'Retirar o apoio?',
        mensagem: 'Seu nome sai da lista de apoiadores e a ocorrência sai da sua lista "Apoio".',
        confirmar: 'Retirar apoio',
      };
}

function mensagemSucesso({ tipo, marcar }: Pedido): string {
  if (tipo === 'afetado') return marcar ? 'Você foi contado como afetado.' : 'Você não conta mais como afetado.';
  return marcar ? 'Apoio registrado.' : 'Apoio retirado.';
}

export interface BotoesParticipacaoProps {
  ocorrencia: OcorrenciaDetalhe;
  /** Há participação desta ocorrência na fila offline (RN-GER-10). */
  aguardandoEnvio: boolean;
}

/** "Também estou sendo afetado" e "Apoiar manifestação" (RN-PAR-01 a 06). */
export function BotoesParticipacao({ ocorrencia, aguardandoEnvio }: BotoesParticipacaoProps) {
  const router = useRouter();
  const { cores } = useTema();
  const { usuario } = useAuth();
  const { mostrarToast } = useToast();
  const participacao = useParticipacao(ocorrencia.id);
  const [confirmando, setConfirmando] = useState<Pedido | null>(null);
  const [emAndamento, setEmAndamento] = useState<TipoParticipacao | null>(null);

  // RN-PAR-05 / RN-ACO-08.
  if (ocorrencia.estado === 'CONCLUIDA') {
    return (
      <AppText variante="subtitulo" cor="textoSecundario">
        Esta ocorrência foi concluída e não aceita mais participações nem comentários.
      </AppText>
    );
  }

  const minha = ocorrencia.minhaParticipacao;
  const autor = minha?.autor ?? false;
  const afetado = minha?.afetado ?? false;
  const apoio = minha?.apoio ?? false;

  const executar = async (pedido: Pedido) => {
    setConfirmando(null);
    setEmAndamento(pedido.tipo);
    try {
      const envio = await participacao.mutateAsync(pedido);
      if (envio.enfileirada) {
        mostrarToast('Sem conexão. Sua participação será enviada quando a internet voltar.');
      } else {
        mostrarToast(mensagemSucesso(pedido), 'sucesso');
      }
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setEmAndamento(null);
    }
  };

  const pedir = (pedido: Pedido) => {
    if (!usuario) {
      router.push('/login');
      return;
    }
    // Confirma ao retirar (doc 09 §2) e ao apoiar quando o nome fica público (fora de Segurança, RN-PAR-07).
    const precisaConfirmar =
      !pedido.marcar || (pedido.tipo === 'apoio' && ocorrencia.categoria !== 'SEGURANCA');
    if (precisaConfirmar) setConfirmando(pedido);
    else void executar(pedido);
  };

  const ocupado = emAndamento !== null || aguardandoEnvio;
  const confirmacao = confirmando ? textoConfirmacao(confirmando) : null;

  return (
    <View style={styles.raiz}>
      {autor ? (
        // RN-PAR-03: o autor conta como afetado, não retira a marcação e não apoia a própria ocorrência.
        <AppText variante="subtitulo" cor="textoSecundario">
          Você registrou esta ocorrência e já conta como afetado.
        </AppText>
      ) : (
        <>
          <CustomButton
            titulo={afetado ? 'Você está sendo afetado' : 'Também estou sendo afetado'}
            rotuloAcessivel={
              afetado ? 'Você está marcado como afetado. Tocar para retirar' : 'Também estou sendo afetado'
            }
            icone={afetado ? 'checkmark-circle' : 'people-outline'}
            variante={afetado ? 'tonal' : 'primario'}
            onPress={() => pedir({ tipo: 'afetado', marcar: !afetado })}
            carregando={emAndamento === 'afetado'}
            disabled={ocupado}
          />
          <CustomButton
            titulo={apoio ? 'Você apoia esta manifestação' : 'Apoiar manifestação'}
            rotuloAcessivel={apoio ? 'Você apoia esta manifestação. Tocar para retirar' : 'Apoiar manifestação'}
            icone={apoio ? 'checkmark-circle' : 'megaphone-outline'}
            variante={apoio ? 'tonal' : 'contorno'}
            onPress={() => pedir({ tipo: 'apoio', marcar: !apoio })}
            carregando={emAndamento === 'apoio'}
            disabled={ocupado}
          />
        </>
      )}

      {!usuario ? (
        <AppText variante="nota" cor="textoTerciario">
          É preciso entrar na sua conta para participar.
        </AppText>
      ) : null}

      {aguardandoEnvio ? (
        <View style={styles.selo}>
          <Badge
            rotulo="Aguardando envio"
            icone="cloud-upload-outline"
            cor={cores.alerta}
            fundo={cores.alertaSuave}
          />
        </View>
      ) : null}

      <ConfirmDialog
        visivel={confirmando !== null}
        icone={confirmando?.tipo === 'apoio' ? 'megaphone-outline' : 'people-outline'}
        titulo={confirmacao?.titulo ?? ''}
        mensagem={confirmacao?.mensagem ?? ''}
        rotuloConfirmar={confirmacao?.confirmar ?? ''}
        perigoso={confirmando?.marcar === false}
        aoConfirmar={() => {
          if (confirmando) void executar(confirmando);
        }}
        aoCancelar={() => setConfirmando(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.sm },
  selo: { flexDirection: 'row' },
});
