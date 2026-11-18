import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

/**
 * Ponto único de configuração de ambiente.
 *
 * DEV  = Expo Go (`npm start`): sem push, sem login Google nativo.
 * PROD = development build / APK (`npm run start:prod`): Google Maps com chave própria e push (FCM).
 *
 * A troca é automática: o app detecta onde está rodando. Nenhum código muda.
 * A fonte de dados é controlada por `EXPO_PUBLIC_DATA_SOURCE` (ver `.env.example`):
 * `bff` (padrão) = BFF na Vercel → API de domínio C#, com login pelo Firebase Authentication;
 * `mock` = tudo simulado no aparelho, para desenvolvimento sem rede.
 */
export type FonteDados = 'bff' | 'mock';

function lerFonteDados(): FonteDados {
  return process.env.EXPO_PUBLIC_DATA_SOURCE === 'mock' ? 'mock' : 'bff';
}

const fonteDados = lerFonteDados();
const rodandoNoExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

function lerTaxaErro(): number {
  const valor = Number(process.env.EXPO_PUBLIC_MOCK_ERROR_RATE ?? '0');
  return Number.isFinite(valor) ? Math.min(Math.max(valor, 0), 1) : 0;
}

const googleMapsIos = Constants.expoConfig?.extra?.googleMapsIos === true;

export const env = {
  ambiente: rodandoNoExpoGo ? 'DEV' : 'PROD',
  rodandoNoExpoGo,
  fonteDados,
  /** Tudo mockado, inclusive login (conta de demonstração e Google simulado). */
  usarMock: fonteDados === 'mock',
  /** No mock, o transporte ao vivo é simulado no app; no BFF, vem da API (SPTrans). */
  transporteSimulado: fonteDados === 'mock',
  /** URL do BFF (`bff/`, na Vercel), sem barra no final. */
  bffUrl: (process.env.EXPO_PUBLIC_BFF_URL ?? '').replace(/\/+$/, ''),
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
