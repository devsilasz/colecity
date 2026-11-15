import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

/** Estado de conexão do aparelho (RN-GER-09). O listener é removido no cleanup. */
export function useConectividade(): { online: boolean } {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const cancelar = NetInfo.addEventListener((estado) => {
      // `isInternetReachable` começa como null: só consideramos offline quando é false.
      setOnline(estado.isConnected !== false && estado.isInternetReachable !== false);
    });
    return cancelar;
  }, []);

  return { online };
}
