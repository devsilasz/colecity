import * as Location from 'expo-location';
import { useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { useBloquearGestoAbas } from '@/components/navigation/CarrosselAbas';
import MapView, { PROVIDER_GOOGLE, type Region } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ESTILO_MAPA_ESCURO } from '@/components/mapa/estiloMapa';
import { REGIAO_SAO_PAULO } from '@/components/mapa/MapaOcorrencias';
import { MiniMapa } from '@/components/mapa/MiniMapa';
import { AppText } from '@/components/ui/AppText';
import { CustomButton } from '@/components/ui/CustomButton';
import { CustomInput } from '@/components/ui/CustomInput';
import { Icon } from '@/components/ui/Icon';
import { IconButton } from '@/components/ui/IconButton';
import { env } from '@/config/env';
import type { LocalEscolhido } from '@/context/RegistroContext';
import { useTema } from '@/context/ThemeContext';
import { useLocalizacao } from '@/hooks/useLocalizacao';
import { espacos, raios } from '@/theme';
import type { Coordenada } from '@/types/api';
import { dentroDeSaoPaulo } from '@/utils/distancia';

/** RN-REG-06. */
const FORA_DE_SAO_PAULO = 'Por enquanto o Colecity funciona apenas na cidade de São Paulo.';

/** "Rua, bairro" a partir da coordenada; `null` se o aparelho não souber. Só para exibição. */
async function descobrirEndereco(coordenada: Coordenada): Promise<string | null> {
  try {
    const [lugar] = await Location.reverseGeocodeAsync({ latitude: coordenada.lat, longitude: coordenada.lng });
    if (!lugar) return null;
    const partes = [lugar.street, lugar.district ?? lugar.subregion].filter(
      (parte): parte is string => typeof parte === 'string' && parte.length > 0,
    );
    return partes.length > 0 ? partes.join(', ') : null;
  } catch {
    return null;
  }
}

export interface SeletorLocalProps {
  local: LocalEscolhido | null;
  aoMudar: (local: LocalEscolhido | null) => void;
  erro?: string | null;
}

/**
 * Localização do registro (RN-REG-06): GPS, ponto escolhido no mapa ou endereço.
 * A permissão de localização é pedida só ao tocar em "Usar minha localização" (RN-GER-07).
 */
export function SeletorLocal({ local, aoMudar, erro }: SeletorLocalProps) {
  const { cores, escuro } = useTema();
  const insets = useSafeAreaInsets();
  const localizacao = useLocalizacao();

  const [aviso, setAviso] = useState<string | null>(null);
  const [mapaAberto, setMapaAberto] = useState(false);
  useBloquearGestoAbas(mapaAberto);
  const [endereco, setEndereco] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [regiaoInicial, setRegiaoInicial] = useState<Region>(REGIAO_SAO_PAULO);
  // Centro atual do mapa aberto; só é lido ao confirmar.
  const centroMapa = useRef<Region>(REGIAO_SAO_PAULO);

  const escolher = async (coordenada: Coordenada) => {
    if (!dentroDeSaoPaulo(coordenada)) {
      setAviso(FORA_DE_SAO_PAULO);
      return;
    }
    setAviso(null);
    aoMudar({ coordenada, endereco: null });
    const texto = await descobrirEndereco(coordenada);
    if (texto) aoMudar({ coordenada, endereco: texto });
  };

  const usarGps = async () => {
    setAviso(null);
    const posicao = await localizacao.obter();
    if (!posicao) {
      setAviso('Não foi possível usar sua localização. Escolha o local no mapa ou busque pelo endereço.');
      return;
    }
    await escolher(posicao);
  };

  const buscarEndereco = async () => {
    const termo = endereco.trim();
    if (termo.length < 3) {
      setAviso('Digite o endereço, por exemplo: Av. Paulista, 1000.');
      return;
    }
    setAviso(null);
    setBuscando(true);
    try {
      const [resultado] = await Location.geocodeAsync(`${termo}, São Paulo, SP, Brasil`);
      if (!resultado) {
        setAviso('Endereço não encontrado. Tente com mais detalhes ou escolha o local no mapa.');
        return;
      }
      await escolher({ lat: resultado.latitude, lng: resultado.longitude });
    } catch {
      setAviso('Não foi possível buscar o endereço neste aparelho. Escolha o local no mapa.');
    } finally {
      setBuscando(false);
    }
  };

  const abrirMapa = () => {
    const regiao: Region = local
      ? {
          latitude: local.coordenada.lat,
          longitude: local.coordenada.lng,
          latitudeDelta: 0.008,
          longitudeDelta: 0.008,
        }
      : REGIAO_SAO_PAULO;
    centroMapa.current = regiao;
    setRegiaoInicial(regiao);
    setMapaAberto(true);
  };

  const confirmarMapa = () => {
    setMapaAberto(false);
    void escolher({ lat: centroMapa.current.latitude, lng: centroMapa.current.longitude });
  };

  const mensagem = aviso ?? erro ?? null;

  return (
    <View style={styles.raiz}>
      {local ? (
        <>
          <MiniMapa
            // Recria o mapa estático quando o ponto muda.
            key={`${local.coordenada.lat},${local.coordenada.lng}`}
            centro={local.coordenada}
            descricao={local.endereco ?? 'local escolhido'}
          />
          <View style={styles.linha}>
            <Icon nome="location-outline" tamanho={18} cor="textoSecundario" />
            <AppText variante="subtitulo" style={styles.flex}>
              {local.endereco ?? 'Local escolhido no mapa'}
            </AppText>
          </View>
          <AppText variante="nota" cor="textoTerciario">
            Para outras pessoas, a localização aparece aproximada (cerca de 100 m).
          </AppText>
        </>
      ) : null}

      <CustomButton
        titulo="Usar minha localização"
        icone="locate-outline"
        variante={local ? 'tonal' : 'primario'}
        onPress={() => void usarGps()}
        carregando={localizacao.buscando}
        disabled={buscando}
      />
      <CustomButton
        titulo={local ? 'Ajustar no mapa' : 'Escolher no mapa'}
        icone="map-outline"
        variante="tonal"
        onPress={abrirMapa}
        disabled={localizacao.buscando || buscando}
      />

      <CustomInput
        rotulo="Ou busque pelo endereço"
        icone="search-outline"
        placeholder="Rua e número, em São Paulo"
        value={endereco}
        onChangeText={setEndereco}
        returnKeyType="search"
        onSubmitEditing={() => void buscarEndereco()}
        editable={!buscando}
      />
      <CustomButton
        titulo="Buscar endereço"
        variante="contorno"
        tamanho="medio"
        onPress={() => void buscarEndereco()}
        carregando={buscando}
        disabled={endereco.trim().length === 0}
      />

      {mensagem ? (
        <View style={styles.linha} accessibilityLiveRegion="polite" accessibilityRole="alert">
          <Icon nome="alert-circle-outline" tamanho={18} cor="perigo" />
          <AppText variante="subtitulo" cor="perigo" style={styles.flex}>
            {mensagem}
          </AppText>
        </View>
      ) : null}

      <Modal
        visible={mapaAberto}
        animationType="slide"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setMapaAberto(false)}>
        <View style={[styles.modal, { backgroundColor: cores.fundo }]}>
          <MapView
            style={StyleSheet.absoluteFill}
            provider={env.recursos.mapaGoogle ? PROVIDER_GOOGLE : undefined}
            initialRegion={regiaoInicial}
            customMapStyle={escuro ? ESTILO_MAPA_ESCURO : []}
            userInterfaceStyle={escuro ? 'dark' : 'light'}
            showsUserLocation={localizacao.permissao === 'concedida'}
            showsMyLocationButton={false}
            toolbarEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            onRegionChangeComplete={(regiao) => {
              centroMapa.current = regiao;
            }}
            accessibilityLabel="Mapa para escolher o local. Mova o mapa até o alfinete ficar sobre o ponto desejado."
          />
          {/* Alfinete fixo no centro: o ponto escolhido é o centro do mapa. */}
          <View pointerEvents="none" style={styles.alfinete}>
            <Icon nome="location" tamanho={44} cor="perigo" />
          </View>

          <View style={[styles.topoModal, { top: insets.top + espacos.sm }]}>
            <IconButton
              icone="close"
              rotulo="Cancelar escolha no mapa"
              variante="vidro"
              onPress={() => setMapaAberto(false)}
            />
            <View style={[styles.dica, { backgroundColor: cores.superficie }]}>
              <AppText variante="nota" cor="textoSecundario">
                Mova o mapa até o alfinete ficar sobre o local.
              </AppText>
            </View>
          </View>

          <View style={[styles.rodapeModal, { bottom: insets.bottom + espacos.lg }]}>
            <CustomButton titulo="Usar este local" icone="checkmark" onPress={confirmarMapa} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.sm },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espacos.sm },
  flex: { flex: 1 },
  modal: { flex: 1 },
  // O alfinete "aponta" com a base: sobe metade da altura para a ponta ficar no centro.
  alfinete: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 44,
  },
  topoModal: {
    position: 'absolute',
    left: espacos.lg,
    right: espacos.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacos.sm,
  },
  dica: {
    flex: 1,
    paddingVertical: espacos.sm,
    paddingHorizontal: espacos.md,
    borderRadius: raios.md,
    borderCurve: 'continuous',
  },
  rodapeModal: { position: 'absolute', left: espacos.lg, right: espacos.lg },
});
