import { Image } from 'expo-image';
import { useState } from 'react';
import { Modal, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTema } from '@/context/ThemeContext';
import { espacos, raios } from '@/theme';
import type { Foto } from '@/types/ocorrencia';

export interface GaleriaFotosProps {
  fotos: readonly Foto[];
  /** Texto para o leitor de tela (ex.: "da ocorrência", "do comentário"). */
  contexto: string;
  tamanho?: number;
  /** Mostra "Denunciar foto" na visualização ampliada (RN-MOD-01). */
  aoDenunciar?: (foto: Foto) => void;
}

/**
 * Miniatura com imagem padrão: se a foto não carregar (sem conexão, ou foto guardada só no
 * aparelho de quem tirou), aparece um ícone no lugar em vez de um espaço vazio.
 */
function Miniatura({ url, tamanho }: { url: string; tamanho: number }) {
  const { cores } = useTema();
  const [falhou, setFalhou] = useState(false);

  if (falhou) {
    return (
      <View
        style={[
          styles.miniatura,
          styles.semFoto,
          { width: tamanho, height: tamanho, backgroundColor: cores.superficieAlt },
        ]}>
        <Icon nome="image-outline" tamanho={28} cor="textoTerciario" />
        <AppText variante="legenda" cor="textoTerciario" centralizado>
          Foto indisponível
        </AppText>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: url }}
      style={[styles.miniatura, { width: tamanho, height: tamanho, backgroundColor: cores.superficieAlt }]}
      contentFit="cover"
      transition={200}
      onError={() => setFalhou(true)}
    />
  );
}

/** Miniaturas roláveis; ao tocar, a foto abre em tela cheia. */
export function GaleriaFotos({ fotos, contexto, tamanho = 132, aoDenunciar }: GaleriaFotosProps) {
  const insets = useSafeAreaInsets();
  const [aberta, setAberta] = useState<Foto | null>(null);

  if (fotos.length === 0) return null;

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.lista}>
        {fotos.map((foto, indice) => (
          <PressableScale
            key={foto.id}
            accessibilityRole="imagebutton"
            accessibilityLabel={`Foto ${indice + 1} de ${fotos.length} ${contexto}`}
            accessibilityHint="Abre a foto em tela cheia"
            onPress={() => setAberta(foto)}
            escala={0.97}>
            <Miniatura url={foto.url} tamanho={tamanho} />
          </PressableScale>
        ))}
      </ScrollView>

      <Modal
        visible={aberta !== null}
        transparent
        statusBarTranslucent
        navigationBarTranslucent
        animationType="fade"
        onRequestClose={() => setAberta(null)}>
        <View accessibilityViewIsModal style={styles.fundo}>
          {aberta ? (
            <Image
              source={{ uri: aberta.url }}
              style={StyleSheet.absoluteFill}
              contentFit="contain"
              accessibilityLabel={`Foto ${contexto} ampliada`}
            />
          ) : null}
          <View style={[styles.fechar, { top: insets.top + espacos.sm }]}>
            <IconButton
              icone="close"
              rotulo="Fechar foto"
              variante="tonal"
              onPress={() => setAberta(null)}
            />
          </View>
          {aoDenunciar && aberta ? (
            <View style={[styles.rodape, { bottom: insets.bottom + espacos.lg }]}>
              <CustomButton
                titulo="Denunciar foto"
                icone="flag-outline"
                variante="perigo"
                tamanho="medio"
                larguraTotal={false}
                onPress={() => {
                  const foto = aberta;
                  setAberta(null);
                  // Espera a foto fechar: o iOS não abre um modal enquanto outro está saindo.
                  setTimeout(() => aoDenunciar(foto), 350);
                }}
              />
            </View>
          ) : null}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  lista: { gap: espacos.sm },
  miniatura: { borderRadius: raios.md, borderCurve: 'continuous' },
  semFoto: { alignItems: 'center', justifyContent: 'center', gap: espacos.xs, padding: espacos.sm },
  fundo: { flex: 1, backgroundColor: '#000000' },
  fechar: { position: 'absolute', right: espacos.lg },
  rodape: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
});
