import { memo } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/AppText';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { IconButton } from '@/components/ui/IconButton';
import { useTema } from '@/context/ThemeContext';
import { espacos } from '@/theme';
import type { Comentario } from '@/types/comentario';
import type { Foto } from '@/types/ocorrencia';
import { tempoRelativo } from '@/utils/formatarData';

import { GaleriaFotos } from './GaleriaFotos';

const REGEX_LINK = /(https?:\/\/[^\s]+)/g;

/** Texto com links tocáveis. O Colecity não valida os links (RN-COM-06). */
function TextoComLinks({ texto }: { texto: string }) {
  const partes = texto.split(REGEX_LINK);
  return (
    <AppText variante="corpo" selectable>
      {partes.map((parte, indice) =>
        indice % 2 === 1 ? (
          <AppText
            key={`${parte}-${indice}`}
            variante="corpo"
            cor="primaria"
            accessibilityRole="link"
            accessibilityHint="Abre o link fora do Colecity"
            style={styles.link}
            onPress={() => void Linking.openURL(parte).catch(() => undefined)}>
            {parte}
          </AppText>
        ) : (
          parte
        ),
      )}
    </AppText>
  );
}

export interface ComentarioItemProps {
  comentario: Comentario;
  /** Usuário logado pode denunciar comentários de outras pessoas. */
  podeDenunciar: boolean;
  aoExcluir: (comentario: Comentario) => void;
  aoDenunciar: (comentario: Comentario) => void;
  aoDenunciarFoto?: (foto: Foto) => void;
}

function ComentarioItemBase({
  comentario,
  podeDenunciar,
  aoExcluir,
  aoDenunciar,
  aoDenunciarFoto,
}: ComentarioItemProps) {
  const { cores } = useTema();
  const nome = comentario.autor.removido ? 'Usuário removido' : comentario.autor.nome;

  return (
    <Card style={styles.raiz}>
      <View style={styles.topo}>
        <View style={styles.autor}>
          <AppText variante="destaque" numberOfLines={1} style={styles.nome}>
            {nome}
          </AppText>
          {/* RN-COM-03 */}
          {comentario.autor.afetado ? (
            <Badge
              rotulo="Afetado"
              icone="people-outline"
              cor={cores.afetados}
              fundo={cores.superficieAlt}
              tamanho="pequeno"
            />
          ) : null}
        </View>
        {comentario.podeExcluir ? (
          <IconButton
            icone="trash-outline"
            rotulo={`Excluir meu comentário de ${tempoRelativo(comentario.criadoEm)}`}
            cor="perigo"
            tamanhoIcone={20}
            onPress={() => aoExcluir(comentario)}
          />
        ) : podeDenunciar ? (
          <IconButton
            icone="flag-outline"
            rotulo={`Denunciar comentário de ${nome}`}
            cor="textoTerciario"
            tamanhoIcone={20}
            onPress={() => aoDenunciar(comentario)}
          />
        ) : null}
      </View>

      <TextoComLinks texto={comentario.texto} />
      <GaleriaFotos
        fotos={comentario.fotos}
        contexto={`do comentário de ${nome}`}
        tamanho={96}
        aoDenunciar={comentario.podeExcluir ? undefined : aoDenunciarFoto}
      />

      <View style={styles.rodape}>
        <AppText variante="nota" cor="textoTerciario">
          {tempoRelativo(comentario.criadoEm)}
        </AppText>
        {comentario.oculto ? (
          <Badge
            rotulo="Oculto para revisão"
            icone="eye-off-outline"
            cor={cores.alerta}
            fundo={cores.alertaSuave}
            tamanho="pequeno"
          />
        ) : null}
      </View>
    </Card>
  );
}

export const ComentarioItem = memo(ComentarioItemBase);

const styles = StyleSheet.create({
  raiz: { gap: espacos.sm },
  topo: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm },
  autor: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: espacos.sm, flexWrap: 'wrap' },
  nome: { flexShrink: 1 },
  rodape: { flexDirection: 'row', alignItems: 'center', gap: espacos.sm, flexWrap: 'wrap' },
  link: { textDecorationLine: 'underline' },
});
