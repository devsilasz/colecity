import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { CustomInput } from '@/components/ui/CustomInput';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/hooks/useAuth';
import { ehErroApi, mensagemDeErro } from '@/services/erros';

const PALAVRA_CONFIRMACAO = 'EXCLUIR';

export interface ExcluirContaDialogProps {
  visivel: boolean;
  aoFechar: () => void;
}

/**
 * Exclusão de conta com confirmação forte (RN-CON-08):
 * senha (ou novo login Google, em conta sem senha) + digitar "EXCLUIR".
 */
export function ExcluirContaDialog({ visivel, aoFechar }: ExcluirContaDialogProps) {
  const { temSenha, excluirConta } = useAuth();
  const { mostrarToast } = useToast();

  const [senha, setSenha] = useState('');
  const [palavra, setPalavra] = useState('');
  const [erroSenha, setErroSenha] = useState<string | null>(null);
  const [excluindo, setExcluindo] = useState(false);

  const fechar = () => {
    setSenha('');
    setPalavra('');
    setErroSenha(null);
    aoFechar();
  };

  const aoExcluir = async () => {
    setErroSenha(null);
    setExcluindo(true);
    try {
      await excluirConta(temSenha ? senha : undefined);
      fechar();
      mostrarToast('Sua conta foi excluída.', 'sucesso');
    } catch (erro) {
      if (ehErroApi(erro) && erro.code === 'SENHA_INCORRETA') setErroSenha(mensagemDeErro(erro));
      else mostrarToast(mensagemDeErro(erro), 'erro');
    } finally {
      setExcluindo(false);
    }
  };

  const palavraOk = palavra.trim().toUpperCase() === PALAVRA_CONFIRMACAO;

  return (
    <ConfirmDialog
      visivel={visivel}
      perigoso
      icone="trash-outline"
      titulo="Excluir conta?"
      mensagem={
        temSenha
          ? 'A exclusão é imediata e definitiva. Seus dados são apagados; ocorrências e comentários permanecem como "Usuário removido".'
          : 'A exclusão é imediata e definitiva. Vamos pedir um novo login com Google para confirmar. Ocorrências e comentários permanecem como "Usuário removido".'
      }
      rotuloConfirmar="Excluir minha conta"
      aoConfirmar={() => void aoExcluir()}
      aoCancelar={fechar}
      carregando={excluindo}
      confirmarDesabilitado={!palavraOk || (temSenha && senha.length === 0)}>
      {temSenha ? (
        <CustomInput
          rotulo="Senha atual"
          senha
          value={senha}
          onChangeText={setSenha}
          erro={erroSenha}
          autoCapitalize="none"
          autoComplete="current-password"
          editable={!excluindo}
        />
      ) : null}
      <CustomInput
        rotulo={`Digite ${PALAVRA_CONFIRMACAO} para confirmar`}
        value={palavra}
        onChangeText={setPalavra}
        autoCapitalize="characters"
        autoCorrect={false}
        editable={!excluindo}
      />
    </ConfirmDialog>
  );
}
