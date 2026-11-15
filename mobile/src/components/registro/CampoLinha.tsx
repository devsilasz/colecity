import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomInput } from '@/components/ui/CustomInput';
import { IconButton } from '@/components/ui/IconButton';
import { ListRow } from '@/components/ui/ListRow';
import { useTema } from '@/context/ThemeContext';
import { transporteService } from '@/services';
import { chaves } from '@/services/queryClient';
import { espacos, raios } from '@/theme';
import type { LinhaRef } from '@/types/transporte';

export interface CampoLinhaProps {
  rotulo: string;
  ajuda?: string;
  valor: LinhaRef | null;
  aoMudar: (linha: LinhaRef | null) => void;
  erro?: string | null;
  disabled?: boolean;
}

/** Busca de linha por número ou nome (RN-TAV-01); a linha é escolhida na lista, nunca digitada livre. */
export function CampoLinha({ rotulo, ajuda, valor, aoMudar, erro, disabled = false }: CampoLinhaProps) {
  const { cores } = useTema();
  const [texto, setTexto] = useState('');
  const [busca, setBusca] = useState('');

  // Espera a pessoa parar de digitar antes de consultar.
  useEffect(() => {
    const temporizador = setTimeout(() => setBusca(texto.trim()), 350);
    return () => clearTimeout(temporizador);
  }, [texto]);

  const linhas = useQuery({
    queryKey: chaves.linhas(busca),
    queryFn: () => transporteService.buscarLinhas(busca),
    enabled: busca.length >= 2 && valor === null,
  });

  if (valor) {
    return (
      <View style={styles.raiz}>
        <AppText variante="notaForte" cor="textoSecundario">
          {rotulo}
        </AppText>
        <View style={[styles.escolhida, { backgroundColor: cores.primariaSuave }]}>
          <View style={styles.flex}>
            <AppText variante="destaque">{valor.codigo}</AppText>
            <AppText variante="nota" cor="textoSecundario">
              {valor.nome}
            </AppText>
          </View>
          <IconButton
            icone="close"
            rotulo={`Remover a linha ${valor.codigo}`}
            disabled={disabled}
            onPress={() => {
              setTexto('');
              aoMudar(null);
            }}
          />
        </View>
      </View>
    );
  }

  const resultados = linhas.data ?? [];

  return (
    <View style={styles.raiz}>
      <CustomInput
        rotulo={rotulo}
        icone="search-outline"
        placeholder="Número ou nome da linha"
        value={texto}
        onChangeText={setTexto}
        erro={erro}
        ajuda={ajuda}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!disabled}
      />
      {busca.length >= 2 ? (
        <View style={[styles.resultados, { borderColor: cores.borda }]} accessibilityLiveRegion="polite">
          {linhas.isPending ? (
            <AppText variante="nota" cor="textoSecundario" style={styles.mensagem}>
              Buscando linhas…
            </AppText>
          ) : linhas.isError ? (
            <AppText variante="nota" cor="perigo" style={styles.mensagem}>
              Não foi possível buscar as linhas. Você pode continuar sem informar a linha.
            </AppText>
          ) : resultados.length === 0 ? (
            <AppText variante="nota" cor="textoSecundario" style={styles.mensagem}>
              Nenhuma linha encontrada.
            </AppText>
          ) : (
            resultados.slice(0, 6).map((linha, indice, lista) => (
              <ListRow
                key={linha.codigo}
                icone="bus-outline"
                titulo={linha.codigo}
                descricao={linha.nome}
                seta={false}
                divisor={indice < lista.length - 1}
                onPress={() => aoMudar({ codigo: linha.codigo, nome: linha.nome })}
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.xs },
  flex: { flex: 1 },
  escolhida: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
    paddingLeft: espacos.lg,
    paddingRight: espacos.xs,
    paddingVertical: espacos.sm,
    borderRadius: raios.md,
    borderCurve: 'continuous',
  },
  resultados: { borderWidth: 1, borderRadius: raios.md, borderCurve: 'continuous', overflow: 'hidden' },
  mensagem: { padding: espacos.lg },
});
