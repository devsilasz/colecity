import { memo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Icon } from '@/components/ui/Icon';
import { PressableScale } from '@/components/ui/PressableScale';
import { NOME_CATEGORIA } from '@/config/categorias';
import { useTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';
import { NOME_ESTADO } from '@/types/estado';
import type { OcorrenciaResumo } from '@/types/ocorrencia';
import { formatarDistancia } from '@/utils/distancia';
import { tempoRelativo } from '@/utils/formatarData';

import { CategoriaBadge } from './CategoriaBadge';
import { ContagemParticipacao } from './ContagemParticipacao';
import { EstadoBadge } from './EstadoBadge';

export interface OcorrenciaCardProps {
  ocorrencia: OcorrenciaResumo;
  onPress: (id: string) => void;
  /** Distância até a posição de referência, quando conhecida (ex.: semelhantes). */
  distanciaMetros?: number;
  /** Atividade nova desde a última visita (RN-MIN-04). */
  novidade?: boolean;
  /** Há ação desta ocorrência na fila offline (RN-GER-10). */
  aguardandoEnvio?: boolean;
}

/** Item de lista: categoria, tipo, bairro, estado, contagens e última atualização (RN-CSL-05). */
function OcorrenciaCardBase({
  ocorrencia,
  onPress,
  distanciaMetros,
  novidade = false,
  aguardandoEnvio = false,
}: OcorrenciaCardProps) {
  const { cores } = useTema();
  const atualizada = tempoRelativo(ocorrencia.ultimaAtividadeEm);
  const participacao = ocorrencia.minhaParticipacao;
  const jaParticipa = Boolean(participacao && (participacao.afetado || participacao.apoio));

  const rotulo = [
    novidade ? 'Com novidades' : null,
    ocorrencia.titulo,
    `Categoria ${NOME_CATEGORIA[ocorrencia.categoria]}`,
    `Estado ${NOME_ESTADO[ocorrencia.estado]}`,
    ocorrencia.zonaAtencao ? 'Em zona de atenção' : null,
    `${ocorrencia.totalAfetados} afetados`,
    `${ocorrencia.totalApoios} apoios`,
    `Atualizada ${atualizada}`,
    distanciaMetros === undefined ? null : `A ${formatarDistancia(distanciaMetros)}`,
    jaParticipa ? 'Você já participa' : null,
    aguardandoEnvio ? 'Aguardando envio' : null,
  ]
    .filter(Boolean)
    .join('. ');

  return (
    <PressableScale
      accessibilityLabel={rotulo}
      accessibilityHint="Abre os detalhes da ocorrência"
      onPress={() => onPress(ocorrencia.id)}
      escala={0.98}>
      <Card>
        <View style={styles.conteudo}>
          <View style={styles.selos}>
            <CategoriaBadge categoria={ocorrencia.categoria} tamanho="pequeno" />
            <EstadoBadge estado={ocorrencia.estado} tamanho="pequeno" />
            {ocorrencia.zonaAtencao ? (
              <Badge
                rotulo="Zona de atenção"
                icone="alert-circle-outline"
                cor={cores.perigo}
                fundo={cores.perigoSuave}
                tamanho="pequeno"
              />
            ) : null}
            {novidade ? (
              <Badge
                rotulo="Novidade"
                icone="sparkles-outline"
                cor={cores.sobrePrimaria}
                fundo={cores.primaria}
                tamanho="pequeno"
              />
            ) : null}
          </View>

          <AppText variante="destaque" numberOfLines={2}>
            {ocorrencia.titulo}
          </AppText>

          <View style={styles.meta}>
            <Icon nome="location-outline" tamanho={14} cor="textoTerciario" />
            <AppText variante="nota" cor="textoSecundario" numberOfLines={1} style={styles.metaTexto}>
              {ocorrencia.bairro}
              {distanciaMetros === undefined ? '' : ` · ${formatarDistancia(distanciaMetros)}`}
              {` · ${atualizada}`}
            </AppText>
          </View>

          <View style={styles.rodape}>
            <ContagemParticipacao
              totalAfetados={ocorrencia.totalAfetados}
              totalApoios={ocorrencia.totalApoios}
            />
            <Icon nome="chevron-forward" tamanho={18} cor="textoTerciario" />
          </View>

          {jaParticipa || aguardandoEnvio ? (
            <View style={styles.selos}>
              {jaParticipa ? (
                <Badge
                  rotulo="Você já participa"
                  icone="checkmark-circle-outline"
                  cor={cores.sucesso}
                  fundo={cores.sucessoSuave}
                  tamanho="pequeno"
                />
              ) : null}
              {aguardandoEnvio ? (
                <Badge
                  rotulo="Aguardando envio"
                  icone="cloud-upload-outline"
                  cor={cores.alerta}
                  fundo={cores.alertaSuave}
                  tamanho="pequeno"
                />
              ) : null}
            </View>
          ) : null}
        </View>
      </Card>
    </PressableScale>
  );
}

export const OcorrenciaCard = memo(OcorrenciaCardBase);

const styles = StyleSheet.create({
  conteudo: { gap: espacos.sm },
  selos: { flexDirection: 'row', flexWrap: 'wrap', gap: espacos.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: espacos.xs },
  metaTexto: { flex: 1 },
  rodape: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacos.sm,
    marginTop: espacos.xs,
  },
});
