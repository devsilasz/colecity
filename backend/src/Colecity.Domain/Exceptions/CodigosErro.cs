namespace Colecity.Domain.Exceptions;

/// <summary>Códigos estáveis de erro do contrato (doc 10, seção 1.2), usados pelo app para escolher a mensagem.</summary>
public static class CodigosErro
{
    public const string RequisicaoInvalida = "REQUISICAO_INVALIDA";
    public const string NaoAutenticado = "NAO_AUTENTICADO";
    public const string SemPermissao = "SEM_PERMISSAO";
    public const string NaoEncontrado = "NAO_ENCONTRADO";
    public const string MuitasRequisicoes = "MUITAS_REQUISICOES";
    public const string RecursoIndisponivel = "RECURSO_INDISPONIVEL";
    public const string ErroInterno = "ERRO_INTERNO";
    public const string Conflito = "CONFLITO";
    public const string IdempotencyKeyObrigatoria = "IDEMPOTENCY_KEY_OBRIGATORIA";

    public const string UsuarioNaoCadastrado = "USUARIO_NAO_CADASTRADO";
    public const string AceiteTermosObrigatorio = "ACEITE_TERMOS_OBRIGATORIO";
    public const string NomeInvalido = "NOME_INVALIDO";
    public const string EmailInvalido = "EMAIL_INVALIDO";
    public const string EmailJaCadastrado = "EMAIL_JA_CADASTRADO";

    public const string CampoObrigatorio = "CAMPO_OBRIGATORIO";
    public const string DescricaoTamanhoInvalido = "DESCRICAO_TAMANHO_INVALIDO";
    public const string TipoInvalidoParaCategoria = "TIPO_INVALIDO_PARA_CATEGORIA";
    public const string LocalizacaoForaDoMunicipio = "LOCALIZACAO_FORA_DO_MUNICIPIO";
    public const string CoordenadaInvalida = "COORDENADA_INVALIDA";
    public const string LinhaInvalida = "LINHA_INVALIDA";
    public const string DataOcorridoInvalida = "DATA_OCORRIDO_INVALIDA";
    public const string FotoInvalida = "FOTO_INVALIDA";
    public const string LimiteFotosExcedido = "LIMITE_FOTOS_EXCEDIDO";
    public const string FeedbackTamanhoInvalido = "FEEDBACK_TAMANHO_INVALIDO";
    public const string SomenteAutor = "SOMENTE_AUTOR";
    public const string SomenteAfetado = "SOMENTE_AFETADO";
    public const string OcorrenciaConcluida = "OCORRENCIA_CONCLUIDA";
    public const string OcorrenciaNaoConcluida = "OCORRENCIA_NAO_CONCLUIDA";
    public const string PrazoReaberturaExpirado = "PRAZO_REABERTURA_EXPIRADO";
    public const string ReaberturaNaoPermitida = "REABERTURA_NAO_PERMITIDA";
    public const string AutorNaoPodeApoiar = "AUTOR_NAO_PODE_APOIAR";
    public const string AutorSempreAfetado = "AUTOR_SEMPRE_AFETADO";

    public const string ComentarioTamanhoInvalido = "COMENTARIO_TAMANHO_INVALIDO";
    public const string DenunciaJaRegistrada = "DENUNCIA_JA_REGISTRADA";

    public const string DesvioNaoDetectado = "DESVIO_NAO_DETECTADO";
}
