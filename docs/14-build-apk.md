# 14 — Ambientes DEV/PROD e build do APK

Como rodar o app em cada ambiente e como gerar o APK. Stack em [09](09-stack-mobile.md); arquitetura em [08](08-arquitetura.md).

## 1. Os dois ambientes

| | DEV | PROD |
|---|---|---|
| Onde roda | **Expo Go** | **Development build** (APK próprio) |
| Comando | `npm start` | `npm run start:prod` |
| Mapa | Google Maps do Expo Go (Android) | Google Maps com a **nossa chave** |
| Push (FCM) | Não funciona | Funciona (Android) |
| Login Google nativo | Não funciona (simulado) | Funciona |
| Precisa de build | Não | Sim, uma vez (seção 4) |

**Não há código para trocar.** O app detecta sozinho onde está rodando (`src/config/env.ts`) e liga ou desliga push, login Google nativo e o provedor do mapa. Em Perfil → Sobre o Colecity → Ambiente aparece `DEV` ou `PROD`.

Mock x API real é outra chave, independente do ambiente: `EXPO_PUBLIC_USE_MOCK` (`true` = dados mockados; `false` = BFF em `EXPO_PUBLIC_BFF_URL`).

## 2. Variáveis

Nomes em `mobile/.env.example`. Valores locais vão em `mobile/.env.local` (ignorado pelo git). Nunca versionar valores reais.

| Variável | Usada em | Para quê |
|---|---|---|
| `EXPO_PUBLIC_USE_MOCK` | app | Mock (`true`) ou BFF (`false`) |
| `EXPO_PUBLIC_BFF_URL` | app | URL base do BFF |
| `EXPO_PUBLIC_MOCK_ERROR_RATE` | app | Chance (0 a 1) de o mock falhar, para testar telas de erro |
| `GOOGLE_MAPS_ANDROID_API_KEY` | build | Chave do Maps SDK for Android |
| `GOOGLE_MAPS_IOS_API_KEY` | build | Chave do Maps SDK for iOS (opcional; habilita mapa de calor no iOS) |
| `GOOGLE_SERVICES_JSON` | build | Caminho do `google-services.json` (push/FCM) |

As três últimas só têm efeito no build: o Expo Go as ignora.

## 3. DEV — Expo Go

```powershell
cd mobile
npm install
npm start
```

Abra o Expo Go no celular e leia o QR code. Celular e computador na mesma rede.

## 4. PROD — development build (APK)

O build é feito na nuvem pelo EAS; não precisa de Android Studio.

### 4.1 Uma vez só

1. Crie uma conta em https://expo.dev.
2. No terminal:
   ```powershell
   cd mobile
   npx eas-cli@latest login
   npx eas-cli@latest init
   ```
   O `init` cria o projeto no EAS e grava o `projectId` no `app.json`. Faça commit dessa alteração.

### 4.2 Chave do Google Maps (Android)

1. No [Google Cloud Console](https://console.cloud.google.com), no mesmo projeto do Firebase, ative **Maps SDK for Android**.
2. Em **APIs e serviços → Credenciais**, crie uma **chave de API**.
3. Restrinja a chave: aplicativos Android, pacote `com.colecity.app` e a impressão digital SHA-1 do app. A SHA-1 aparece em `npx eas-cli@latest credentials -p android` depois do primeiro build. Restrinja também à API "Maps SDK for Android".
4. Cadastre a chave no EAS, nos ambientes `development` e `preview`, com o nome `GOOGLE_MAPS_ANDROID_API_KEY`: em expo.dev → projeto → **Environment variables**, ou pelo comando `npx eas-cli@latest env:create`.
5. Para `npx expo run:android` local (opcional), coloque a mesma chave em `mobile/.env.local`.

Sem a chave o build funciona, mas o mapa fica em branco.

### 4.3 Push (FCM) — quando o Firebase for ligado

1. No console do Firebase, adicione um app **Android** com o pacote `com.colecity.app`.
2. Baixe o `google-services.json` e salve em `mobile/google-services.json` (é configuração pública do cliente, pode ser versionado).
3. Em `mobile/eas.json`, adicione `"GOOGLE_SERVICES_JSON": "./google-services.json"` no `env` dos perfis `development` e `preview`. Para uso local, a mesma linha em `.env.local`.
4. Gere um novo build (mudança nativa).

O envio do push é feito pelo BFF (doc 08); o app só registra o token.

### 4.4 Gerar e instalar

```powershell
npm run build:dev
```

- Na primeira vez o EAS pergunta se pode gerar o keystore do Android: aceite.
- Ao terminar, o EAS mostra um link e um QR code para baixar o APK. Instale no celular (permita "instalar apps desconhecidos").
- Depois, para desenvolver:
  ```powershell
  npm run start:prod
  ```
  Abra o app **Colecity** instalado e leia o QR code.

Só é preciso gerar outro build quando mudar algo nativo: dependência com código nativo, `app.config.ts`, chaves ou `google-services.json`. Mudanças de TypeScript chegam pelo servidor de desenvolvimento.

### 4.5 APK independente (para demonstração e vídeo)

```powershell
npm run build:apk
```

Gera um APK com o JavaScript embutido: funciona sem computador e sem servidor de desenvolvimento. Usa o perfil `preview` do `eas.json`.

## 5. Problemas comuns

| Sintoma | Causa provável |
|---|---|
| Mapa em branco no APK | Chave do Maps ausente, API não ativada ou SHA-1/pacote da restrição não confere |
| Push não chega | Rodando no Expo Go, `google-services.json` ausente no build ou permissão negada |
| "No development build installed" | Rodou `start:prod` sem instalar o APK da seção 4.4 |
| Mudou plugin ou chave e nada mudou | Falta gerar um novo build |
