import { env } from '@/config/env';
import { ErroApi } from '@/services/erros';

import googleServices from '../../google-services.json';

/**
 * Login nativo do Google (`@react-native-google-signin/google-signin`), só no APK / development build.
 *
 * A biblioteca tem código nativo que não existe no Expo Go: por isso é carregada sob demanda e,
 * fora do build próprio, qualquer chamada resolve como "recurso indisponível", sem travar o app.
 * O `webClientId` (cliente OAuth "web" do Firebase) vem do `google-services.json`, que é
 * configuração pública do cliente.
 */

type ModuloGoogle = typeof import('@react-native-google-signin/google-signin');

/** Cliente OAuth do tipo web (`client_type: 3`), exigido para o Firebase aceitar o idToken. */
function idClienteWeb(): string | null {
  for (const cliente of googleServices.client) {
    for (const oauth of cliente.oauth_client) {
      if (oauth.client_type === 3) return oauth.client_id;
    }
  }
  return null;
}

let configurado: Promise<ModuloGoogle> | null = null;

function carregar(): Promise<ModuloGoogle> {
  if (!env.recursos.loginGoogleNativo) {
    return Promise.reject(new ErroApi('RECURSO_INDISPONIVEL', 501));
  }
  configurado ??= import('@react-native-google-signin/google-signin')
    .then((modulo) => {
      const webClientId = idClienteWeb();
      if (!webClientId) throw new ErroApi('RECURSO_INDISPONIVEL', 501);
      modulo.GoogleSignin.configure({ webClientId });
      return modulo;
    })
    .catch((falha: unknown) => {
      configurado = null;
      throw falha instanceof ErroApi ? falha : new ErroApi('RECURSO_INDISPONIVEL', 501);
    });
  return configurado;
}

export type ResultadoGoogleNativo = { tipo: 'OK'; idToken: string } | { tipo: 'CANCELADO' };

export const googleNativo = {
  /**
   * Abre a escolha de conta do Google e devolve o `idToken`. Mostra sempre o seletor de contas
   * (faz `signOut` local antes), para a pessoa poder escolher outra conta.
   */
  async entrar(): Promise<ResultadoGoogleNativo> {
    const { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } = await carregar();
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      await GoogleSignin.signOut().catch(() => null);
      const resposta = await GoogleSignin.signIn();
      if (!isSuccessResponse(resposta)) return { tipo: 'CANCELADO' };
      const { idToken } = resposta.data;
      if (!idToken) throw new ErroApi('ERRO_INTERNO', 500);
      return { tipo: 'OK', idToken };
    } catch (falha) {
      if (falha instanceof ErroApi) throw falha;
      if (isErrorWithCode(falha)) {
        if (falha.code === statusCodes.SIGN_IN_CANCELLED || falha.code === statusCodes.IN_PROGRESS) {
          return { tipo: 'CANCELADO' };
        }
        if (falha.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          throw new ErroApi('RECURSO_INDISPONIVEL', 501);
        }
      }
      // Sem rede, ou SHA-1 do app não cadastrada no Firebase (DEVELOPER_ERROR).
      throw new ErroApi('ERRO_INTERNO', 500);
    }
  },

  /** Encerra a sessão do Google no aparelho (no logout do app). Nunca falha. */
  async sair(): Promise<void> {
    if (!env.recursos.loginGoogleNativo) return;
    try {
      const { GoogleSignin } = await carregar();
      await GoogleSignin.signOut();
    } catch {
      // Sem sessão do Google ou fora do build próprio.
    }
  },
};
