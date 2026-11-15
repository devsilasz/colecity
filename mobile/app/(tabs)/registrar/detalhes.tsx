import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { CategoriaBadge } from '@/components/ocorrencia/CategoriaBadge';
import { DynamicField, validarCampos } from '@/components/registro/DynamicField';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NOME_TIPO } from '@/config/categorias';
import { camposDoPasso, FORMULARIOS } from '@/config/formularios';
import { useRegistro, valorFotos, valorLinha, valorTexto } from '@/context/RegistroContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { useConectividade } from '@/hooks/useConectividade';
import type { FotoLocal } from '@/services/contratos';
import { ehErroApi, mensagemDeErro } from '@/services/erros';
import { enviarOuEnfileirar } from '@/services/offlineQueue';
import { chaves, queryClient } from '@/services/queryClient';
import { espacos } from '@/theme';
import { montarBusca } from '@/utils/registro';

/** Registrar, passo 3: descrição, fotos e demais campos do formulário dinâmico (RN-REG-02 a 04). */
export default function DetalhesRegistroScreen() {
  const router = useRouter();
  const { usuario } = useAuth();
  const { online } = useConectividade();
  const { mostrarToast } = useToast();
  const { categoria, valores, local, definirValor, limpar } = useRegistro();

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroGeral, setErroGeral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  // Depois do envio o rascunho é limpo; evita voltar ao passo 1 antes de sair desta tela.
  const [concluido, setConcluido] = useState(false);

  const base = montarBusca(categoria, valores, local);
  if (!base || !local || !usuario) {
    return concluido ? null : <Redirect href="/registrar" />;
  }

  const config = FORMULARIOS[base.categoria];
  const campos = camposDoPasso(config, 'detalhes');
  const linha = valorLinha(valores.linha);

  const registrar = async () => {
    const novosErros = validarCampos(campos, valores);
    setErros(novosErros);
    setErroGeral(null);
    if (Object.keys(novosErros).length > 0) return;

    const fotosLocais = valorFotos(valores.fotos).flatMap((foto): FotoLocal[] => (foto.local ? [foto.local] : []));

    setEnviando(true);
    try {
      const envio = await enviarOuEnfileirar(
        {
          tipo: 'CRIAR_OCORRENCIA',
          dados: {
            categoria: base.categoria,
            tipo: base.tipo,
            descricao: valorTexto(valores.descricao).trim(),
            localizacao: base.localizacao,
            linha: base.linha,
            // RN-REG-03: sem data informada, vale o momento do registro (definido pelo servidor).
            dataHoraOcorrido: base.categoria === 'SEGURANCA' ? valorTexto(valores.dataHoraOcorrido) || null : null,
          },
          fotosLocais,
          resumo: NOME_TIPO[base.tipo],
        },
        usuario.uid,
        online,
      );

      setConcluido(true);
      limpar();
      if (router.canDismiss()) router.dismissAll();

      if (envio.enfileirada) {
        mostrarToast('Sem conexão. Seu registro será enviado quando a internet voltar.');
        router.navigate('/explorar');
        return;
      }

      void queryClient.invalidateQueries({ queryKey: chaves.ocorrencias });
      void queryClient.invalidateQueries({ queryKey: chaves.mapa });
      mostrarToast('Ocorrência registrada. Obrigado por colaborar!', 'sucesso');
      if (envio.resultado.tipo === 'CRIAR_OCORRENCIA') {
        const criada = envio.resultado.ocorrencia;
        queryClient.setQueryData(chaves.ocorrencia(criada.id), criada);
        router.navigate({ pathname: '/explorar/[id]', params: { id: criada.id } });
      }
    } catch (erro) {
      const mensagem = mensagemDeErro(erro);
      if (ehErroApi(erro) && erro.code === 'DESCRICAO_TAMANHO_INVALIDO') setErros({ descricao: mensagem });
      else if (ehErroApi(erro) && erro.code === 'DATA_OCORRIDO_INVALIDA') setErros({ dataHoraOcorrido: mensagem });
      else setErroGeral(mensagem);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <ScreenScroll titulo="Detalhes" subtitulo="Conte o que está acontecendo" aoVoltar={() => router.back()} evitarTeclado>
      <OfflineBanner detalhe="Você pode registrar mesmo assim: o envio acontece quando a internet voltar." />

      <Card style={styles.resumo}>
        <View style={styles.selos}>
          <CategoriaBadge categoria={base.categoria} />
        </View>
        <AppText variante="destaque">{NOME_TIPO[base.tipo]}</AppText>
        <View style={styles.linha}>
          <Icon nome="location-outline" tamanho={18} cor="textoSecundario" />
          <AppText variante="subtitulo" cor="textoSecundario" style={styles.flex}>
            {local.endereco ?? 'Local escolhido no mapa'}
          </AppText>
        </View>
        {linha ? (
          <View style={styles.linha}>
            <Icon nome="bus-outline" tamanho={18} cor="textoSecundario" />
            <AppText variante="subtitulo" cor="textoSecundario" style={styles.flex}>
              Linha {linha.codigo} · {linha.nome}
            </AppText>
          </View>
        ) : null}
        {/* RN-REG-07 */}
        <AppText variante="nota" cor="textoTerciario">
          O título é criado automaticamente com o tipo, a rua e o bairro.
        </AppText>
      </Card>

      {config.aviso ? (
        // RN-REG-12
        <Card style={styles.aviso}>
          <Icon nome="call-outline" tamanho={22} cor="perigo" />
          <AppText variante="subtitulo" style={styles.flex}>
            {config.aviso}
          </AppText>
        </Card>
      ) : null}

      <SectionTitle>Detalhes</SectionTitle>
      <Card style={styles.campos}>
        {campos.map((campo) => (
          <DynamicField
            key={campo.id}
            campo={campo}
            valor={valores[campo.id]}
            aoMudar={(valor) => {
              definirValor(campo.id, valor);
              setErros((atuais) => ({ ...atuais, [campo.id]: '' }));
            }}
            erro={erros[campo.id] || null}
            disabled={enviando}
          />
        ))}
      </Card>

      {erroGeral ? (
        <AppText variante="subtitulo" cor="perigo" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {erroGeral}
        </AppText>
      ) : null}

      <CustomButton
        titulo="Registrar ocorrência"
        icone="checkmark"
        onPress={() => void registrar()}
        carregando={enviando}
      />
    </ScreenScroll>
  );
}

const styles = StyleSheet.create({
  resumo: { gap: espacos.sm },
  selos: { flexDirection: 'row' },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espacos.sm },
  aviso: { flexDirection: 'row', gap: espacos.md, alignItems: 'flex-start' },
  campos: { gap: espacos.lg },
  flex: { flex: 1 },
});
