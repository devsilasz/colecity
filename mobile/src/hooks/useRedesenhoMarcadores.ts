import { useEffect, useState } from 'react';

/** Tempo para o texto e os ícones do marcador serem desenhados antes de o mapa "fotografá-lo". */
const JANELA_MS = 900;

/**
 * Valor de `tracksViewChanges` dos marcadores com conteúdo próprio (texto e ícones).
 *
 * No Android o mapa transforma o conteúdo do marcador em imagem. Com `tracksViewChanges={false}`
 * desde o início, a imagem é tirada antes de o texto e a fonte de ícones aparecerem e o marcador
 * fica vazio. Por isso o acompanhamento fica ligado por um instante sempre que a `assinatura`
 * (o que está desenhado) muda, e depois desliga para não gastar bateria.
 */
export function useRedesenhoMarcadores(assinatura: string): boolean {
  const [desenhada, setDesenhada] = useState<string | null>(null);

  useEffect(() => {
    const espera = setTimeout(() => setDesenhada(assinatura), JANELA_MS);
    return () => clearTimeout(espera);
  }, [assinatura]);

  return desenhada !== assinatura;
}
