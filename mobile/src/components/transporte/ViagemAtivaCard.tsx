import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomButton } from '@/components/ui/CustomButton';
import { Icon } from '@/components/ui/Icon';
import { useToast } from '@/context/ToastContext';
import { INTERVALO_POSICAO_MS } from '@/context/ViagemContext';
import { useViagem } from '@/hooks/useViagem';
import { espacos } from '@/theme';
import { formatarHora } from '@/utils/formatarData';

export interface ViagemAtivaCardProps {
  /** Abre a tela da linha da viagem (omitido quando já estamos nela). */
  aoAbrirLinha?: (codigo: string) => void;
}

/** Aviso permanente de que a localização está sendo compartilhada, com o botão de encerrar. */
export function ViagemAtivaCard({ aoAbrirLinha }: ViagemAtivaCardProps) {
  const { viagem, encerrar } = useViagem();
  const { mostrarToast } = useToast();
  const [confirmando, setConfirmando] = useState(false);

  if (!viagem) return null;

  const intervalo =
    INTERVALO_POSICAO_MS >= 60 * 1000
      ? `${Math.round(INTERVALO_POSICAO_MS / 60000)} minuto`
      : `${Math.round(INTERVALO_POSICAO_MS / 1000)} segundos`;

  return (
    <Card style={styles.raiz}>
      <View style={styles.linha} accessibilityLiveRegion="polite">
        <Icon nome="radio-outline" tamanho={22} cor="sucesso" />
        <View style={styles.flex}>
          <AppText variante="destaque">Você está no ônibus {viagem.linha.codigo}</AppText>
          <AppText variante="nota" cor="textoSecundario">
            Sentido {viagem.destino}. Sua localização é enviada a cada {intervalo}, só com o app aberto,
            até {formatarHora(viagem.expiraEm)}.
          </AppText>
          <AppText variante="nota" cor="textoTerciario">
            {viagem.posicoesEnviadas === 0
              ? 'Enviando a primeira posição…'
              : `${viagem.posicoesEnviadas} ${viagem.posicoesEnviadas === 1 ? 'posição enviada' : 'posições enviadas'}. O mapa mostra só o ônibus, nunca você.`}
          </AppText>
        </View>
      </View>

      <View style={styles.acoes}>
        {aoAbrirLinha ? (
          <CustomButton
            titulo="Ver a linha"
            variante="tonal"
            tamanho="medio"
            larguraTotal={false}
            style={styles.acao}
            onPress={() => aoAbrirLinha(viagem.linha.codigo)}
          />
        ) : null}
        <CustomButton
          titulo="Encerrar viagem"
          icone="stop-circle-outline"
          variante="perigo"
          tamanho="medio"
          larguraTotal={false}
          style={styles.acao}
          onPress={() => setConfirmando(true)}
        />
      </View>

      <ConfirmDialog
        visivel={confirmando}
        icone="stop-circle-outline"
        titulo="Encerrar a viagem?"
        mensagem="Sua localização deixa de ser compartilhada imediatamente."
        rotuloConfirmar="Encerrar"
        aoConfirmar={() => {
          setConfirmando(false);
          void encerrar().then(() => mostrarToast('Viagem encerrada. Obrigado por colaborar!', 'sucesso'));
        }}
        aoCancelar={() => setConfirmando(false)}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  raiz: { gap: espacos.md },
  linha: { flexDirection: 'row', alignItems: 'flex-start', gap: espacos.md },
  flex: { flex: 1, gap: espacos.xxs },
  acoes: { flexDirection: 'row', gap: espacos.sm },
  acao: { flex: 1, alignSelf: 'auto' },
});
