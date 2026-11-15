import * as Haptics from 'expo-haptics';

export type TipoHaptico = 'leve' | 'medio' | 'selecao' | 'sucesso' | 'alerta' | 'erro';

/** Feedback tátil sutil. Falhas (aparelho sem motor háptico) são ignoradas. */
export function vibrar(tipo: TipoHaptico = 'leve'): void {
  const acao = (() => {
    switch (tipo) {
      case 'leve':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      case 'medio':
        return Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      case 'selecao':
        return Haptics.selectionAsync();
      case 'sucesso':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      case 'alerta':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      case 'erro':
        return Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  })();
  acao.catch(() => undefined);
}
