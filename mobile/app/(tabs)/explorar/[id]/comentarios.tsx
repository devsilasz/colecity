import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, TextInput, View } from 'react-native';

import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorMessage } from '@/components/feedback/ErrorMessage';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { SkeletonList } from '@/components/feedback/Skeleton';
import { ComentarioItem } from '@/components/ocorrencia/ComentarioItem';
import { DenunciaSheet, type AlvoDenuncia } from '@/components/ocorrencia/DenunciaSheet';
import { FotoPicker, type FotoSelecionada } from '@/components/ocorrencia/FotoPicker';
import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useEspacosTela } from '@/hooks/useCabecalhoRolavel';
import { useComentarios } from '@/hooks/useComentarios';
import { pendentesDaOcorrencia, useFilaOffline } from '@/hooks/useFilaOffline';
import { useOcorrencia } from '@/hooks/useOcorrencia';
import type { FotoLocal } from '@/services/contratos';
import { mensagemDeErro } from '@/services/erros';
import { ESCALA_FONTE_MAXIMA, espacos, raios, tipografia } from '@/theme';
import type { Comentario } from '@/types/comentario';
import type { Foto } from '@/types/ocorrencia';
import { comentarioValido, LIMITES } from '@/utils/validacoes';

/** Campo de novo comentário: 1 a 500 caracteres e até 3 fotos (RN-COM-02). */
function Compositor({ ocorrenciaId }: { ocorrenciaId: string }) {
  const { cores } = useTema();
  const { mostrarToast } = useToast();
  const { criar } = useComentarios(ocorrenciaId);
  const [texto, setTexto] = useState('');
  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);

  const enviar = async () => {
    if (!comentarioValido(texto)) return;
    const locais = fotos.flatMap((foto): FotoLocal[] => (foto.local ? [foto.local] : []));
    try {
      const envio = await criar.mutateAsync({ texto, fotos: locais });
      setTexto('');
      setFotos([]);
      mostrarToast(
        envio.enfileirada
          ? 'Sem conexão. Seu comentário será enviado quando a internet voltar.'
          : 'Comentário publicado.',
        envio.enfileirada ? 'info' : 'sucesso',
      );
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    }
  };

  return (
    <View style={styles.compositor}>
      <FotoPicker compacto fotos={fotos} aoMudar={setFotos} disabled={criar.isPending} />
      <View style={styles.linhaEnvio}>
        <TextInput
          accessibilityLabel="Escrever comentário"
          accessibilityHint={`Até ${LIMITES.comentarioMax} caracteres`}
          placeholder="Escreva um comentário"
          placeholderTextColor={cores.textoTerciario}
          selectionColor={cores.primaria}
          maxFontSizeMultiplier={ESCALA_FONTE_MAXIMA}
          value={texto}
          onChangeText={setTexto}
          maxLength={LIMITES.comentarioMax}
          multiline
          editable={!criar.isPending}
          style={[
            styles.entrada,
            { color: cores.texto, backgroundColor: cores.superficieAlt, borderColor: cores.borda },
          ]}
        />
        {criar.isPending ? (
          <View style={styles.enviando}>
            <ActivityIndicator color={cores.primaria} accessibilityLabel="Enviando comentário" />
          </View>
        ) : (
          <IconButton
            icone="send"
            rotulo="Enviar comentário"
            variante="tonal"
            disabled={!comentarioValido(texto)}
            onPress={() => void enviar()}
          />
        )}
      </View>
      <AppText
        variante="nota"
        cor="textoTerciario"
        accessibilityLabel={`${texto.length} de ${LIMITES.comentarioMax} caracteres`}>
        {texto.length}/{LIMITES.comentarioMax}
      </AppText>
    </View>
  );
}

/** Comentários da ocorrência: leitura aberta, escrita para quem tem conta (RN-COM-01 a 06). */
export default function ComentariosScreen() {
  const router = useRouter();
  const { cores } = useTema();
  const { mostrarToast } = useToast();
  const { usuario } = useAuth();
  const { topo, insets } = useEspacosTela();
  const { id = '' } = useLocalSearchParams<{ id: string }>();

  const ocorrencia = useOcorrencia(id);
  const lista = useComentarios(id);
  const fila = useFilaOffline(usuario?.uid ?? null);

  const [excluindo, setExcluindo] = useState<Comentario | null>(null);
  const [denuncia, setDenuncia] = useState<AlvoDenuncia | null>(null);

  const pendentes = pendentesDaOcorrencia(fila.itens, id).filter((item) => item.acao.tipo === 'COMENTAR');
  const concluida = ocorrencia.data?.estado === 'CONCLUIDA';
  const logado = usuario !== null;

  const aoExcluir = useCallback((comentario: Comentario) => setExcluindo(comentario), []);
  const aoDenunciar = useCallback(
    (comentario: Comentario) => setDenuncia({ tipoConteudo: 'COMENTARIO', conteudoId: comentario.id }),
    [],
  );
  const aoDenunciarFoto = useCallback(
    (foto: Foto) => setDenuncia({ tipoConteudo: 'FOTO', conteudoId: foto.id }),
    [],
  );

  const confirmarExclusao = async () => {
    if (!excluindo) return;
    try {
      await lista.excluir.mutateAsync(excluindo.id);
      mostrarToast('Comentário excluído.', 'sucesso');
    } catch (erro) {
      mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setExcluindo(null);
    }
  };

  const semDados = lista.comentarios.length === 0 && pendentes.length === 0;

  return (
    <Screen
      evitarTeclado
      sobreposicao={<ScreenHeader titulo="Comentários" aoVoltar={() => router.back()} />}>
      <View style={styles.raiz}>
        <FlatList
          data={lista.comentarios}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ComentarioItem
              comentario={item}
              podeDenunciar={logado}
              aoExcluir={aoExcluir}
              aoDenunciar={aoDenunciar}
              aoDenunciarFoto={logado ? aoDenunciarFoto : undefined}
            />
          )}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (lista.temMais && !lista.carregandoMais) void lista.carregarMais();
          }}
          onEndReachedThreshold={0.4}
          contentContainerStyle={[styles.conteudo, { paddingTop: topo + espacos.md }]}
          refreshControl={
            <RefreshControl
              refreshing={lista.atualizando && !lista.carregandoMais}
              onRefresh={() => void lista.recarregar()}
              tintColor={cores.primaria}
              colors={[cores.primaria]}
              progressViewOffset={topo}
            />
          }
          ListHeaderComponent={
            <View style={styles.cabecalho}>
              <OfflineBanner detalhe="Mostrando os últimos comentários carregados." />
              {/* RN-COM-06 */}
              <AppText variante="nota" cor="textoTerciario">
                Do mais antigo para o mais recente. Links não são verificados pelo Colecity: avalie a fonte
                antes de abrir.
              </AppText>
              {semDados ? (
                lista.carregando && !lista.pausada ? (
                  <SkeletonList quantidade={3} />
                ) : lista.erro ? (
                  <Card semPadding>
                    <ErrorMessage
                      mensagem={mensagemDeErro(lista.erro)}
                      aoTentarNovamente={() => void lista.recarregar()}
                      tentando={lista.atualizando}
                    />
                  </Card>
                ) : lista.pausada ? (
                  <Card semPadding>
                    <EmptyState
                      icone="cloud-offline-outline"
                      titulo="Sem conexão"
                      descricao="Conecte-se à internet para carregar os comentários."
                    />
                  </Card>
                ) : (
                  <Card semPadding>
                    <EmptyState
                      icone="chatbubbles-outline"
                      titulo="Nenhum comentário ainda"
                      descricao={
                        concluida
                          ? 'Esta ocorrência foi concluída sem comentários.'
                          : 'Conte como a situação está ou traga uma informação útil para quem acompanha.'
                      }
                    />
                  </Card>
                )
              ) : null}
            </View>
          }
          ListFooterComponent={
            <View style={styles.rodapeLista}>
              {lista.carregandoMais ? (
                <ActivityIndicator color={cores.primaria} accessibilityLabel="Carregando mais comentários" />
              ) : null}
              {pendentes.map((item) =>
                item.acao.tipo === 'COMENTAR' ? (
                  <Card key={item.id} style={styles.pendente}>
                    <AppText variante="corpo">{item.acao.texto}</AppText>
                    <View style={styles.linhaPendente}>
                      <Badge
                        rotulo={item.status === 'ERRO' ? 'Não enviado' : 'Aguardando envio'}
                        icone={item.status === 'ERRO' ? 'alert-circle-outline' : 'cloud-upload-outline'}
                        cor={item.status === 'ERRO' ? cores.perigo : cores.alerta}
                        fundo={item.status === 'ERRO' ? cores.perigoSuave : cores.alertaSuave}
                        tamanho="pequeno"
                      />
                      {item.status === 'ERRO' ? (
                        <CustomButton
                          titulo="Descartar"
                          variante="texto"
                          tamanho="medio"
                          larguraTotal={false}
                          onPress={() => fila.remover(item.id)}
                        />
                      ) : null}
                    </View>
                    {item.erro ? (
                      <AppText variante="nota" cor="perigo">
                        {item.erro}
                      </AppText>
                    ) : null}
                  </Card>
                ) : null,
              )}
            </View>
          }
        />

        <View
          style={[
            styles.barra,
            {
              backgroundColor: cores.superficie,
              borderTopColor: cores.divisor,
              paddingBottom: insets.bottom + espacos.sm,
            },
          ]}>
          {concluida ? (
            // RN-COM-01 / RN-ACO-08
            <AppText variante="subtitulo" cor="textoSecundario" centralizado>
              Ocorrência concluída: não aceita novos comentários.
            </AppText>
          ) : logado ? (
            <Compositor ocorrenciaId={id} />
          ) : (
            <CustomButton
              titulo="Entrar para comentar"
              icone="log-in-outline"
              variante="tonal"
              onPress={() => router.push('/login')}
            />
          )}
        </View>
      </View>

      <ConfirmDialog
        visivel={excluindo !== null}
        perigoso
        icone="trash-outline"
        titulo="Excluir comentário?"
        mensagem="O comentário é apagado para todos e não pode ser recuperado."
        rotuloConfirmar="Excluir"
        aoConfirmar={() => void confirmarExclusao()}
        aoCancelar={() => setExcluindo(null)}
        carregando={lista.excluir.isPending}
      />
      <DenunciaSheet alvo={denuncia} aoFechar={() => setDenuncia(null)} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1 },
  conteudo: { paddingHorizontal: espacos.lg, paddingBottom: espacos.lg, gap: espacos.md },
  cabecalho: { gap: espacos.md },
  rodapeLista: { gap: espacos.md },
  pendente: { gap: espacos.sm },
  linhaPendente: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espacos.sm },
  barra: {
    paddingHorizontal: espacos.lg,
    paddingTop: espacos.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  compositor: { gap: espacos.xs },
  linhaEnvio: { flexDirection: 'row', alignItems: 'flex-end', gap: espacos.sm },
  entrada: {
    ...tipografia.corpo,
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    borderWidth: 1,
    borderRadius: raios.md,
    borderCurve: 'continuous',
    paddingHorizontal: espacos.md,
    paddingVertical: espacos.sm,
  },
  enviando: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
