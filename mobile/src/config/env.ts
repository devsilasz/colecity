import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Ponto único de configuração de ambiente.
 *
 * DEV  = Expo Go (`npm start`): sem push, sem login Google nativo.
 * PROD = development build / APK (`npm run start:prod`): Google Maps com chave própria e push (FCM).
 *
 * A troca é automática: o app detecta onde está rodando. Nenhum código muda.
 * Mock x API real é controlado por `EXPO_PUBLIC_USE_MOCK` (ver `.env.example`).
 */
const rodandoNoExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function lerTaxaErro(): number {
  const valor = Number(process.env.EXPO_PUBLIC_MOCK_ERROR_RATE ?? '0');
  return Number.isFinite(valor) ? Math.min(Math.max(valor, 0), 1) : 0;
}

const googleMapsIos = Constants.expoConfig?.extra?.googleMapsIos === true;

export const env = {
  ambiente: rodandoNoExpoGo ? 'DEV' : 'PROD',
  rodandoNoExpoGo,
  /** `true` (padrão) usa os adaptadores mock; `false` usa o BFF. */
  usarMock: process.env.EXPO_PUBLIC_USE_MOCK !== 'false',
  bffUrl: process.env.EXPO_PUBLIC_BFF_URL ?? '',
  mockTaxaErro: lerTaxaErro(),
  recursos: {
    /** Push só no Android e fora do Expo Go (RN-NOT, doc 09 §4.4). */
    push: !rodandoNoExpoGo && Platform.OS === 'android',
    /** Login Google nativo exige build próprio. */
    loginGoogleNativo: !rodandoNoExpoGo,
    /** Provedor Google no mapa: sempre no Android; no iOS só em build com chave. */
    mapaGoogle: Platform.OS === 'android' || (!rodandoNoExpoGo && googleMapsIos),
  },
} as const;

export type Ambiente = (typeof env)['ambiente'];
