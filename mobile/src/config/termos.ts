/**
 * Textos dos termos de uso e da política de privacidade (RN-GER-06, RN-GER-08).
 * Ao alterar o conteúdo, atualize também `VERSAO_TERMOS` em `types/usuario.ts`.
 */

/** RN-GER-08: aviso fixo nos termos e na tela "Sobre". */
export const AVISO_NAO_OFICIAL =
  'O Colecity não é um canal oficial da Prefeitura e não encaminha manifestações a órgãos públicos.';

export interface SecaoTexto {
  titulo: string;
  paragrafos: string[];
}

export const TERMOS_DE_USO: SecaoTexto[] = [
  {
    titulo: 'O que é o Colecity',
    paragrafos: [
      'O Colecity é um aplicativo colaborativo para relatar, acompanhar e se mobilizar em torno de problemas urbanos da cidade de São Paulo.',
      AVISO_NAO_OFICIAL,
    ],
  },
  {
    titulo: 'Sua conta',
    paragrafos: [
      'Para registrar, participar e comentar é preciso ter uma conta, criada com e-mail e senha ou com Google.',
      'Você é responsável pelo que publica. Apenas o seu nome aparece para outras pessoas; o e-mail nunca é exibido.',
    ],
  },
  {
    titulo: 'O que você pode publicar',
    paragrafos: [
      'Relate apenas situações reais, na cidade de São Paulo, nas categorias oferecidas pelo aplicativo.',
      'Não publique dados de outras pessoas (nome, descrição física, placa de veículo), ofensas, conteúdo ilegal ou imagens que exponham alguém.',
      'Conteúdos denunciados podem ser ocultados e removidos.',
    ],
  },
  {
    titulo: 'Relatos de Segurança',
    paragrafos: [
      'Em emergência, ligue 190. Registre o boletim de ocorrência na Delegacia Eletrônica. O Colecity não substitui a polícia.',
    ],
  },
  {
    titulo: 'Limites do serviço',
    paragrafos: [
      'As informações são enviadas pela comunidade e podem estar incompletas ou desatualizadas. O mapa de calor e a Zona de atenção são indicativos.',
      'O Colecity é um projeto acadêmico e pode ficar indisponível ou ser alterado.',
    ],
  },
];

export const POLITICA_DE_PRIVACIDADE: SecaoTexto[] = [
  {
    titulo: 'Dados que coletamos',
    paragrafos: [
      'Nome e e-mail da conta; ocorrências, comentários, fotos e participações que você publicar; a localização informada em cada registro.',
      'No Transporte ao vivo, a posição do aparelho só é enviada enquanto "Estou neste ônibus" estiver ativo.',
    ],
  },
  {
    titulo: 'Localização',
    paragrafos: [
      'A localização só é pedida no momento de uso: ao registrar, ao filtrar por distância e no Transporte ao vivo. Se você negar, pode escolher o local no mapa ou por endereço.',
      'O aplicativo não acompanha sua localização em segundo plano.',
    ],
  },
  {
    titulo: 'Notificações',
    paragrafos: [
      'As notificações são opcionais, pedidas apenas depois do seu primeiro registro ou participação, e podem ser desligadas no Perfil.',
    ],
  },
  {
    titulo: 'Exclusão da conta',
    paragrafos: [
      'Você pode excluir a conta a qualquer momento no Perfil. A exclusão é imediata e definitiva: nome, e-mail, senha, vínculo com o Google, tokens de notificação e posições do Transporte ao vivo são apagados.',
      'Suas participações deixam de ser contadas. Ocorrências e comentários permanecem, exibidos como "Usuário removido".',
    ],
  },
];
