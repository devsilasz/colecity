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

A fonte de dados é outra chave, independente do ambiente: `EXPO_PUBLIC_DATA_SOURCE` (`bff` = BFF em `EXPO_PUBLIC_BFF_URL` + API de domínio, padrão; `mock` = dados de demonstração no aparelho).

## 2. Variáveis

Nomes em `mobile/.env.example`. Valores locais vão em `mobile/.env.local`. Tanto `.env` quanto `.env.local` são ignorados pelo git; só o `.env.example` (apenas nomes) é versionado. Nunca versionar valores reais.

| Variável | Usada em | Para quê |
|---|---|---|
| `EXPO_PUBLIC_DATA_SOURCE` | app | `bff` (padrão) ou `mock` |
| `EXPO_PUBLIC_BFF_URL` | app | URL do BFF (`bff/`, na Vercel), sem barra no final |
| `EXPO_PUBLIC_MOCK_ERROR_RATE` | app | Chance (0 a 1) de o mock falhar, para testar telas de erro |
| `API_KEY_MAPS` | build | Chave do Maps SDK for Android |
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
4. Cadastre a chave no EAS com o nome `API_KEY_MAPS`. O build roda na nuvem e **não lê o `.env` local**. Para o perfil `preview` (APK):
   ```powershell
   npx eas-cli@latest env:create --name API_KEY_MAPS --value "SUA_CHAVE" --environment preview --visibility sensitive
   ```
   Para o development build, repita com `--environment development`. Também dá para cadastrar em expo.dev → projeto → **Environment variables**.
5. Para `npx expo run:android` local (opcional), coloque a mesma chave em `mobile/.env.local`.

Sem a chave o build funciona, mas o mapa fica em branco.

### 4.3 Push (FCM)

1. No console do Firebase → Configurações do projeto → Seus apps, adicione um app **Android** com o pacote `com.colecity.app`.
2. Baixe o `google-services.json` e salve em `mobile/google-services.json` (é configuração pública do cliente e é versionado). Os perfis `development` e `preview` do `eas.json` já apontam para ele; **sem o arquivo o build falha**.
3. Credencial do FCM V1 para o Expo enviar push: console do Firebase → Configurações do projeto → **Contas de serviço** → **Gerar nova chave privada**. Depois:
   ```powershell
   npx eas-cli@latest credentials
   ```
   Android → perfil → **Google Service Account** → **Manage your Google Service Account Key for Push Notifications (FCM V1)** → envie o JSON. Esse arquivo nunca vai para o repositório.
4. Publique o BFF (`bff/README.md`) e coloque a URL em `EXPO_PUBLIC_BFF_URL`, no `env` dos perfis `development` e `preview` do `eas.json` (já preenchido).
5. Publique as regras do Firestore (`mobile/firestore.rules`), que cobrem só `users/{uid}` e as subcoleções `occurrenceState` e `devices`.
6. Gere um novo build (mudança nativa).

O app só registra o token. Quando alguém comenta, conclui, reabre ou confirma um desvio, o domínio avisa o BFF, que decide quem recebe e envia (doc 08).

### 4.3.1 Login com Google

1. Depois do primeiro build, pegue a SHA-1: `npx eas-cli@latest credentials` → Android → perfil → **SHA1 Fingerprint**.
2. Console do Firebase → Configurações do projeto → app Android → **Adicionar impressão digital** → cole a SHA-1.
3. Baixe o `google-services.json` atualizado e substitua `mobile/google-services.json`.
4. Gere um novo build.

Sem a SHA-1 o login com Google falha com `DEVELOPER_ERROR`. Cada keystore tem a sua SHA-1: os perfis `development` e `preview` usam o mesmo keystore do EAS, então uma impressão digital basta.

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
| APK fecha ao abrir, log com `Failed to create an instance of class androidx.work.impl.WorkDatabase` | R8 (minificação) removeu classes do WorkManager. Já corrigido no `app.config.ts` (`expo-build-properties`: minificação desligada + regras de keep do Room); gerar um novo build |
| APK fecha ao abrir (outro motivo) | Ligar o celular por USB com depuração ativa e ler o erro: `adb logcat -b crash` |
