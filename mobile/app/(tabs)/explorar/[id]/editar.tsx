import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { Loading } from '@/components/feedback/Loading';
import { FotoPicker, type FotoSelecionada } from '@/components/ocorrencia/FotoPicker';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
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
import { descricaoValida, LIMITES } from '@/utils/validacoes';

function Formulario({ ocorrencia }: { ocorrencia: OcorrenciaDetalhe }) {
  const router = useRouter();
  const { mostrarToast } = useToast();
  const [descricao, setDescricao] = useState(ocorrencia.descricao);
  const [fotos, setFotos] = useState<FotoSelecionada[]>(() =>
    ocorrencia.fotos.map((foto) => ({ chave: foto.id, uri: foto.url, path: foto.path })),
  );
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const salvar = async () => {
    if (!descricaoValida(descricao)) {
      setErro('A descrição deve ter de 10 a 500 caracteres.');
      return;
    }
    setErro(null);
    setSalvando(true);
    try {
      // Fotos novas sobem para o Storage; as que já existiam mantêm a referência.
      const refs: FotoRef[] = [];
      for (const foto of fotos) {
        if (foto.path) refs.push({ path: foto.path });
        else if (foto.local) refs.push({ path: (await uploadService.enviar(foto.local, 'ocorrencias')).path });
      }
      const atualizada = await ocorrenciaService.editar(ocorrencia.id, { descricao: descricao.trim(), fotos: refs });
      queryClient.setQueryData(chaves.ocorrencia(ocorrencia.id), atualizada);
      mostrarToast('Ocorrência atualizada.', 'sucesso');
      router.back();
    } catch (falha) {
      mostrarToast(mensagemDeErro(falha), 'erro');
    } finally {
      setSalvando(false);
    }
  };

  return (
    <>
      <Card style={styles.bloco}>
        <AppText variante="destaque">{ocorrencia.titulo}</AppText>
        {/* RN-REG-09 */}
        <AppText variante="nota" cor="textoTerciario">
          Categoria, tipo e localização não podem ser alterados.
        </AppText>
      </Card>

      <SectionTitle>Descrição</SectionTitle>
      <Card>
        <CustomInput
          rotulo="Descrição"
          obrigatorio
          multiline
          contador
          value={descricao}
          onChangeText={setDescricao}
          erro={erro}
          ajuda={
            ocorrencia.categoria === 'SEGURANCA'
              ? 'Não inclua dados de terceiros (descrição física, placa ou nome).'
              : 'De 10 a 500 caracteres.'
          }
          maxLength={LIMITES.descricaoMax}
          editable={!salvando}
        />
      </Card>

      <SectionTitle>Fotos</SectionTitle>
      <Card>
        <FotoPicker fotos={fotos} aoMudar={setFotos} disabled={salvando} />
      </Card>

      <CustomButton titulo="Salvar alterações" onPress={() => void salvar()} carregando={salvando} />
    </>
  );
}

/** Edição pelo autor: descrição e fotos, enquanto não estiver concluída (RN-REG-09). */
export default function EditarOcorrenciaScreen() {
  const router = useRouter();
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const consulta = useOcorrencia(id);
  const ocorrencia = consulta.data;

  return (
    <ScreenScroll titulo="Editar ocorrência" aoVoltar={() => router.back()} evitarTeclado>
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
      ) : ocorrencia.podeEditar ? (
        <Formulario ocorrencia={ocorrencia} />
      ) : (
        <Card semPadding>
          <EmptyState
            icone="lock-closed-outline"
            titulo="Edição indisponível"
            descricao="Só quem registrou pode editar, e apenas enquanto a ocorrência não estiver concluída."
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
