import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { IconButton } from '@/components/ui/IconButton';
import { useTema } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import { uploadService } from '@/services';
import type { FotoLocal } from '@/services/contratos';
import { espacos, raios } from '@/theme';
import { LIMITES } from '@/utils/validacoes';

/** Foto no formulário: já publicada (`path`) ou nova, comprimida no aparelho (`local`). */
export interface FotoSelecionada {
  chave: string;
  uri: string;
  path?: string;
  local?: FotoLocal;
}

export interface FotoPickerProps {
  fotos: readonly FotoSelecionada[];
  aoMudar: (fotos: FotoSelecionada[]) => void;
  maximo?: number;
  disabled?: boolean;
  /** Versão enxuta (só ícones), para a barra de comentário. */
  compacto?: boolean;
}

const OPCOES: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };

/** Escolha de fotos pela câmera ou galeria, já convertidas para WebP (RN-REG-04, RN-COM-02). */
export function FotoPicker({
  fotos,
  aoMudar,
  maximo = LIMITES.fotosMax,
  disabled = false,
  compacto = false,
}: FotoPickerProps) {
  const { cores } = useTema();
  const { mostrarToast } = useToast();
  const [processando, setProcessando] = useState(false);

  const vagas = maximo - fotos.length;
  const bloqueado = disabled || processando || vagas <= 0;

  const adicionar = async (uris: readonly string[]) => {
    setProcessando(true);
    try {
      const novas: FotoSelecionada[] = [];
      for (const uri of uris.slice(0, vagas)) {
        const local = await uploadService.comprimir(uri);
        novas.push({ chave: local.uri, uri: local.uri, local });
      }
      aoMudar([...fotos, ...novas]);
    } catch {
      mostrarToast('Não foi possível usar esta foto. Escolha outra imagem.', 'erro');
    } finally {
      setProcessando(false);
    }
  };

  const abrirGaleria = async () => {
    try {
      const resultado = await ImagePicker.launchImageLibraryAsync({
        ...OPCOES,
        allowsMultipleSelection: vagas > 1,
        selectionLimit: vagas,
      });
      if (!resultado.canceled) await adicionar(resultado.assets.map((asset) => asset.uri));
    } catch {
      mostrarToast('Não foi possível abrir a galeria.', 'erro');
    }
  };

  const abrirCamera = async () => {
    try {
      // Permissão pedida só no momento de uso.
      const permissao = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissao.granted) {
        mostrarToast('Permita o uso da câmera nas configurações ou escolha uma foto da galeria.', 'erro');
        return;
      }
      const resultado = await ImagePicker.launchCameraAsync(OPCOES);
      if (!resultado.canceled) await adicionar(resultado.assets.map((asset) => asset.uri));
    } catch {
      mostrarToast('Não foi possível abrir a câmera.', 'erro');
    }
  };

  const miniaturas =
    fotos.length > 0 || processando ? (
      <View style={styles.miniaturas}>
        {fotos.map((foto, indice) => (
          <View key={foto.chave} style={styles.miniatura}>
            <Image
              source={{ uri: foto.uri }}
              style={[styles.imagem, { backgroundColor: cores.superficieAlt }]}
              contentFit="cover"
              accessibilityLabel={`Foto ${indice + 1} de ${fotos.length}`}
            />
            <View style={[styles.remover, { backgroundColor: cores.veu }]}>
              <IconButton
                icone="close"
                rotulo={`Remover foto ${indice + 1}`}
                tamanhoIcone={18}
                cor="textoInverso"
                disabled={disabled}
                onPress={() => aoMudar(fotos.filter((atual) => atual.chave !== foto.chave))}
              />
            </View>
          </View>
        ))}
        {processando ? (
          <View style={[styles.miniatura, styles.centro, { backgroundColor: cores.superficieAlt }]}>
            <ActivityIndicator color={cores.primaria} accessibilityLabel="Processando foto" />
          </View>
        ) : null}
      </View>
    ) : null;

  if (compacto) {
    return (
      <View style={styles.compacto}>
        {miniaturas}
        <View style={styles.linha}>
          <IconButton
            icone="camera-outline"
            rotulo="Tirar foto"
            variante="tonal"
            disabled={bloqueado}
            onPress={() => void abrirCamera()}
          />
          <IconButton
            icone="image-outline"
            rotulo="Escolher foto da galeria"
            variante="tonal"
            disabled={bloqueado}
            onPress={() => void abrirGaleria()}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.raiz}>
      {miniaturas}
      <View style={styles.linha}>
        <CustomButton
          titulo="Câmera"
          icone="camera-outline"
          variante="tonal"
          tamanho="medio"
          larguraTotal={false}
          disabled={bloqueado}
          onPress={() => void abrirCamera()}
          style={styles.flex}
        />
        <CustomButton
          titulo="Galeria"
          icone="image-outline"
          variante="tonal"
          tamanho="medio"
          larguraTotal={false}
          disabled={bloqueado}
          onPress={() => void abrirGaleria()}
          style={styles.flex}
        />
      </View>
      <AppText variante="nota" cor="textoTerciario">
        {fotos.length} de {maximo} fotos. As imagens são reduzidas no aparelho antes do envio.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.sm },
  compacto: { gap: espacos.sm },
  linha: { flexDirection: 'row', gap: espacos.sm },
  flex: { flex: 1, alignSelf: 'auto' },
  miniaturas: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.sm },
  miniatura: { width: 88, height: 88, borderRadius: raios.md, borderCurve: 'continuous', overflow: 'hidden' },
  centro: { alignItems: 'center', justifyContent: 'center' },
  imagem: { width: '100%', height: '100%' },
  remover: { position: 'absolute', top: 0, right: 0, borderBottomLeftRadius: raios.md },
});
