import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { CustomButton } from '@/components/ui/CustomButton';
import { useToast } from '@/context/ToastContext';
import { ocorrenciaService } from '@/services';
import { mensagemDeErro } from '@/services/erros';
import { espacos } from '@/theme';
import type { MotivoDenuncia, TipoConteudo } from '@/types/ocorrencia';

export interface AlvoDenuncia {
  tipoConteudo: TipoConteudo;
  conteudoId: string;
}

const MOTIVOS: readonly { valor: MotivoDenuncia; rotulo: string }[] = [
  { valor: 'OFENSIVO', rotulo: 'Ofensivo' },
  { valor: 'DADOS_PESSOAIS', rotulo: 'Expõe dados pessoais' },
  { valor: 'SPAM', rotulo: 'Spam' },
  { valor: 'FALSO', rotulo: 'Informação falsa' },
];

const NOME_CONTEUDO: Record<TipoConteudo, string> = {
  OCORRENCIA: 'ocorrência',
  COMENTARIO: 'comentário',
  FOTO: 'foto',
};

export interface DenunciaSheetProps {
  /** Conteúdo denunciado; `null` mantém o painel fechado. */
  alvo: AlvoDenuncia | null;
  aoFechar: () => void;
}

/** Denúncia de ocorrência, comentário ou foto, com motivo (RN-MOD-01). */
export function DenunciaSheet({ alvo, aoFechar }: DenunciaSheetProps) {
  const { mostrarToast } = useToast();
  const [motivo, setMotivo] = useState<MotivoDenuncia | null>(null);
  const [enviando, setEnviando] = useState(false);

  const fechar = () => {
    setMotivo(null);
    aoFechar();
  };

  const enviar = async () => {
    if (!alvo || !motivo) return;
    setEnviando(true);
    try {
      await ocorrenciaService.denunciar({ ...alvo, motivo });
      mostrarToast('Denúncia enviada. Nossa equipe vai analisar.', 'sucesso');
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setEnviando(false);
      fechar();
    }
  };

  return (
    <BottomSheet
      visivel={alvo !== null}
      aoFechar={fechar}
      titulo={alvo ? `Denunciar ${NOME_CONTEUDO[alvo.tipoConteudo]}` : 'Denunciar'}
      rodape={
        <CustomButton
          titulo="Enviar denúncia"
          variante="perigo"
          onPress={() => void enviar()}
          carregando={enviando}
          disabled={motivo === null}
        />
      }>
      <AppText variante="subtitulo" cor="textoSecundario">
        Qual é o problema? Com várias denúncias, o conteúdo fica oculto até a revisão da equipe Colecity.
      </AppText>
      <View style={styles.motivos} accessibilityRole="radiogroup">
        {MOTIVOS.map((opcao) => (
          <Chip
            key={opcao.valor}
            rotulo={opcao.rotulo}
            selecionado={motivo === opcao.valor}
            onPress={() => setMotivo(opcao.valor)}
          />
        ))}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  motivos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
});
