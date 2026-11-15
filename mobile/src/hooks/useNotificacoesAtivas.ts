import { useMutation, useQuery } from '@tanstack/react-query';

import { userDataService } from '@/services';
import { chaves, queryClient } from '@/services/queryClient';

/** Preferência "receber notificações" do usuário (RN-NOT-04). */
export function useNotificacoesAtivas(uid: string | null) {
  const chave = [...chaves.dadosUsuario(uid ?? ''), 'notificacoes'] as const;

  const consulta = useQuery({
    queryKey: chave,
    queryFn: () => userDataService.obterNotificacoesAtivas(uid ?? ''),
    enabled: uid !== null,
    networkMode: 'always',
  });

  const mutacao = useMutation({
    mutationFn: (ativas: boolean) => userDataService.definirNotificacoesAtivas(uid ?? '', ativas),
    onMutate: (ativas) => {
      const anterior = queryClient.getQueryData<boolean>(chave);
      queryClient.setQueryData(chave, ativas);
      return { anterior };
    },
    onError: (_erro, _ativas, contexto) => {
      queryClient.setQueryData(chave, contexto?.anterior);
    },
  });

  return {
    ativas: consulta.data ?? true,
    carregando: consulta.isPending && uid !== null,
    definir: mutacao.mutate,
    erro: mutacao.error,
  };
}
