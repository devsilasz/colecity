import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Configuração do app. Estende o `app.json`, onde o EAS grava o `projectId` (`eas init`).
 *
 * - DEV (Expo Go): nenhuma variável é obrigatória.
 * - PROD (development build / APK): defina as chaves do Google Maps e o caminho do
 *   `google-services.json` em `.env.local` (ou nas variáveis do EAS).
 *
 * Passo a passo completo em `docs/14-build-apk.md`.
 */
const GOOGLE_MAPS_ANDROID_API_KEY = process.env.GOOGLE_MAPS_ANDROID_API_KEY;
const GOOGLE_MAPS_IOS_API_KEY = process.env.GOOGLE_MAPS_IOS_API_KEY;

/** Caminho do google-services.json (FCM). Local: ./google-services.json; no EAS: variável do tipo arquivo. */
const GOOGLE_SERVICES_JSON = process.env.GOOGLE_SERVICES_JSON;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Colecity',
  slug: 'colecity',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'colecity',
  userInterfaceStyle: 'automatic',
  ios: {
    bundleIdentifier: 'com.colecity.app',
    icon: './assets/expo.icon',
    supportsTablet: false,
  },
  android: {
    package: 'com.colecity.app',
    adaptiveIcon: {
      backgroundColor: '#E8EEFF',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    ...(GOOGLE_SERVICES_JSON ? { googleServicesFile: GOOGLE_SERVICES_JSON } : {}),
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#2450D8',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'O Colecity usa sua localização para registrar ocorrências, filtrar por distância e no Transporte ao vivo.',
      },
    ],
    [
      'expo-image-picker',
      {
        photosPermission: 'O Colecity acessa suas fotos para anexá-las a ocorrências e comentários.',
        cameraPermission: 'O Colecity usa a câmera para fotografar o problema que você está relatando.',
      },
    ],
    'expo-notifications',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: GOOGLE_MAPS_ANDROID_API_KEY,
        iosGoogleMapsApiKey: GOOGLE_MAPS_IOS_API_KEY,
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    ...config.extra,
    // Indica ao app se o provedor Google está disponível no iOS (mapa de calor).
    googleMapsIos: Boolean(GOOGLE_MAPS_IOS_API_KEY),
  },
});
