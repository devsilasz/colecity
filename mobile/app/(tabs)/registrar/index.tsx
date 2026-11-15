import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AuthGate } from '@/components/auth/AuthGate';
import { OfflineBanner } from '@/components/feedback/OfflineBanner';
import { DynamicField, validarCampos } from '@/components/registro/DynamicField';
import { SeletorLocal } from '@/components/registro/SeletorLocal';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { ScreenScroll } from '@/components/ui/ScreenScroll';
import { SectionTitle } from '@/components/ui/SectionTitle';
import { NOME_CATEGORIA } from '@/config/categorias';
import { camposDoPasso, FORMULARIOS } from '@/config/formularios';
import { useRegistro } from '@/context/RegistroContext';
import { useConectividade } from '@/hooks/useConectividade';
import { ocorrenciaService } from '@/services';
import { ehErroApi } from '@/services/erros';
import { chaves, queryClient } from '@/services/queryClient';
import { aparenciaCategoria, espacos } from '@/theme';
import { CATEGORIAS } from '@/types/categoria';
import { montarBusca } from '@/utils/registro';

function PassoInicial() {
  const router = useRouter();
  const { online } = useConectividade();
  const { categoria, valores, local, definirCategoria, definirValor, definirLocal } = useRegistro();

  const [erros, setErros] = useState<Record<string, string>>({});
  const [erroCategoria, setErroCategoria] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [avancando, setAvancando] = useState(false);

  const config = categoria ? FORMULARIOS[categoria] : null;
  const campos = config ? camposDoPasso(config, 'inicio') : [];

  const continuar = async () => {
    const novosErros = validarCampos(campos, valores);
    setErros(novosErros);
    setErroCategoria(categoria ? null : 'Escolha a categoria.');
    setErroLocal(local ? null : 'Informe onde o problema está acontecendo.');

    const busca = montarBusca(categoria, valores, local);
    if (!busca || Object.keys(novosErros).length > 0) return;

    // RN-SEM-04: Segurança não sugere semelhantes. Sem conexão, o registro segue direto.
    if (busca.categoria === 'SEGURANCA' || !online) {
      router.push('/registrar/detalhes');
      return;
    }

    setAvancando(true);
    try {
      const semelhantes = await queryClient.fetchQuery({
        queryKey: chaves.semelhantes(busca),
        queryFn: () => ocorrenciaService.semelhantes(busca),
        staleTime: 30 * 1000,
      });
      // RN-SEM-08: sem semelhantes, segue direto.
      router.push(semelhantes.length > 0 ? '/registrar/semelhantes' : '/registrar/detalhes');
    } catch (erro) {
      if (ehErroApi(erro) && erro.code === 'LOCALIZACAO_FORA_DO_MUNICIPIO') {
        setErroLocal(erro.message);
      } else {
        // A sugestão nunca bloqueia a criação (RN-SEM-08).
        router.push('/registrar/detalhes');
      }
    } finally {
      setAvancando(false);
    }
  };

  return (
    <ScreenScroll titulo="Registrar" subtitulo="O que está acontecendo?" comTabBar evitarTeclado>
      <OfflineBanner detalhe="Você pode registrar mesmo assim: o envio acontece quando a internet voltar." />

      <SectionTitle>Categoria</SectionTitle>
      <Card style={styles.bloco}>
        <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Categoria">
          {CATEGORIAS.map((opcao) => (
            <Chip
              key={opcao}
              rotulo={NOME_CATEGORIA[opcao]}
              icone={aparenciaCategoria[opcao].icone}
              selecionado={categoria === opcao}
              onPress={() => {
                definirCategoria(opcao);
                setErros({});
                setErroCategoria(null);
              }}
            />
          ))}
        </View>
        {erroCategoria ? (
          <AppText variante="nota" cor="perigo" accessibilityLiveRegion="polite">
            {erroCategoria}
          </AppText>
        ) : null}
      </Card>

      {config?.aviso ? (
        // RN-REG-12
        <Card style={styles.aviso}>
          <Icon nome="call-outline" tamanho={22} cor="perigo" />
          <AppText variante="subtitulo" style={styles.flex}>
            {config.aviso}
          </AppText>
        </Card>
      ) : null}

      {campos.length > 0 ? (
        <>
          <SectionTitle>Sobre o problema</SectionTitle>
          <Card style={styles.bloco}>
            {campos.map((campo) => (
              <DynamicField
                // A `key` com a categoria recomeça o campo ao trocar de categoria.
                key={`${categoria}-${campo.id}`}
                campo={campo}
                valor={valores[campo.id]}
                aoMudar={(valor) => {
                  definirValor(campo.id, valor);
                  setErros((atuais) => ({ ...atuais, [campo.id]: '' }));
                }}
                erro={erros[campo.id] || null}
              />
            ))}
          </Card>
        </>
      ) : null}

      <SectionTitle>Onde</SectionTitle>
      <Card>
        <SeletorLocal
          local={local}
          aoMudar={(novo) => {
            definirLocal(novo);
            setErroLocal(null);
          }}
          erro={erroLocal}
        />
      </Card>

      <CustomButton
        titulo="Continuar"
        icone="arrow-forward"
        onPress={() => void continuar()}
        carregando={avancando}
      />
    </ScreenScroll>
  );
}

/** Registrar, passo 1: categoria, tipo e localização (RN-REG-01, 02, 05, 06). */
export default function RegistrarScreen() {
  return (
    <AuthGate
      titulo="Registrar"
      comTabBar
      icone="add-circle-outline"
      descricao="Entre para registrar o que está acontecendo no seu bairro.">
      <PassoInicial />
    </AuthGate>
  );
}

const styles = StyleSheet.create({
  bloco: { gap: espacos.lg },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
  aviso: { flexDirection: 'row', gap: espacos.md, alignItems: 'flex-start' },
  flex: { flex: 1 },
});
