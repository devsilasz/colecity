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
/** Chave da Maps SDK for Android. Local: `.env.local`; no EAS: variável do ambiente do perfil. */
const API_KEY_MAPS = process.env.API_KEY_MAPS;
const GOOGLE_MAPS_IOS_API_KEY = process.env.GOOGLE_MAPS_IOS_API_KEY;

/**
 * Caminho do `google-services.json` do Firebase (FCM, necessário para o push no Android).
 * O arquivo é configuração pública do cliente e fica versionado em `mobile/google-services.json`;
 * os perfis do `eas.json` apontam para ele. Sem a variável o build funciona, mas sem push.
 */
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
    ...(API_KEY_MAPS ? { config: { googleMaps: { apiKey: API_KEY_MAPS } } } : {}),
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
    [
      'expo-build-properties',
      {
        android: {
          // O R8 (minificação do build de release) removia a classe gerada do banco interno do
          // WorkManager (`WorkDatabase_Impl`, usado por notificações e Google Play Services) e o
          // app fechava ao abrir. Sem minificação o APK fica um pouco maior, mas abre.
          enableMinifyInReleaseBuilds: false,
          enableShrinkResourcesInReleaseBuilds: false,
          // Se a minificação for ligada no futuro, estas regras mantêm as classes do Room.
          extraProguardRules: [
            '-keep class * extends androidx.room.RoomDatabase { <init>(); }',
            '-keep class androidx.work.impl.WorkDatabase_Impl { *; }',
          ].join('\n'),
        },
      },
    ],
    'expo-notifications',
    // Login com Google (Android). Lê o `google-services.json` configurado acima.
    '@react-native-google-signin/google-signin',
    [
      'react-native-maps',
      {
        androidGoogleMapsApiKey: API_KEY_MAPS,
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
