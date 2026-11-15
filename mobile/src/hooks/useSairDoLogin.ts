import { useRouter } from 'expo-router';
import { useCallback } from 'react';

/** Fecha o fluxo de login e volta para a tela de onde o usuário veio. */
export function useSairDoLogin(): () => void {
  const router = useRouter();
  return useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/explorar');
  }, [router]);
}
