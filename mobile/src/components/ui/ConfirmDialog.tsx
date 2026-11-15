import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Modal, Platform, StyleSheet, View } from 'react-native';

import { useTema } from '@/context/ThemeContext';
import { espacos, raios, type NomeIcone } from '@/theme';

import { AppText } from './AppText';
import { CustomButton } from './CustomButton';
import { BlurTargetContext, GlassSurface } from './GlassSurface';
import { Icon } from './Icon';

export interface ConfirmDialogProps {
  visivel: boolean;
  titulo: string;
  mensagem: string;
  rotuloConfirmar: string;
  rotuloCancelar?: string;
  aoConfirmar: () => void;
  aoCancelar: () => void;
  /** Ação destrutiva: botão de confirmação em vermelho. */
  perigoso?: boolean;
  carregando?: boolean;
  confirmarDesabilitado?: boolean;
  icone?: NomeIcone;
  /** Conteúdo extra (ex.: campo para digitar "EXCLUIR"). */
  children?: ReactNode;
}

/** Confirmação antes de ações relevantes (doc 09 §2). */
export function ConfirmDialog({
  visivel,
  titulo,
  mensagem,
  rotuloConfirmar,
  rotuloCancelar = 'Cancelar',
  aoConfirmar,
  aoCancelar,
  perigoso = false,
  carregando = false,
  confirmarDesabilitado = false,
  icone,
  children,
}: ConfirmDialogProps) {
  const { cores } = useTema();

  return (
    <Modal
      visible={visivel}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={aoCancelar}>
      <BlurTargetContext.Provider value={null}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.raiz, { backgroundColor: cores.veu }]}>
          <GlassSurface raio={raios.xl} intensidade="espessa" sombra="flutuante" style={styles.caixa}>
            <View accessibilityViewIsModal accessibilityRole="alert" style={styles.conteudo}>
              {icone ? (
                <View
                  style={[
                    styles.icone,
                    { backgroundColor: perigoso ? cores.perigoSuave : cores.primariaSuave },
                  ]}>
                  <Icon nome={icone} tamanho={26} cor={perigoso ? 'perigo' : 'primaria'} />
                </View>
              ) : null}
              <AppText variante="titulo3" centralizado>
                {titulo}
              </AppText>
              <AppText variante="subtitulo" cor="textoSecundario" centralizado>
                {mensagem}
              </AppText>
              {children}
              <View style={styles.acoes}>
                <CustomButton
                  titulo={rotuloConfirmar}
                  variante={perigoso ? 'perigo' : 'primario'}
                  onPress={aoConfirmar}
                  carregando={carregando}
                  disabled={confirmarDesabilitado}
                  haptico={perigoso ? 'alerta' : 'leve'}
                />
                <CustomButton
                  titulo={rotuloCancelar}
                  variante="texto"
                  onPress={aoCancelar}
                  disabled={carregando}
                />
              </View>
            </View>
          </GlassSurface>
        </KeyboardAvoidingView>
      </BlurTargetContext.Provider>
    </Modal>
  );
}

const styles = StyleSheet.create({
  raiz: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: espacos.xxl },
  caixa: { width: '100%', maxWidth: 420 },
  conteudo: { padding: espacos.xxl, gap: espacos.md, alignItems: 'stretch' },
  icone: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acoes: { marginTop: espacos.sm, gap: espacos.xs },
});
