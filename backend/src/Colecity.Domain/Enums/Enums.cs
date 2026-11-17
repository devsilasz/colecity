namespace Colecity.Domain.Enums;

/// <summary>Aberta → Em acompanhamento → Concluída (RN-ACO-01).</summary>
public enum EstadoOcorrencia
{
    Aberta = 1,
    EmAcompanhamento,
    Concluida
}

public enum MotivoConclusao
{
    Autor = 1,
    Inatividade
}

public enum TipoParticipacao
{
    Afetado = 1,
    Apoio
}

public enum TipoEventoLinhaDoTempo
{
    Criada = 1,
    EstadoAlterado,
    MarcoAfetados,
    DesvioDetectado,
    Concluida,
    Reaberta
}

public enum MotivoDenuncia
{
    Ofensivo = 1,
    DadosPessoais,
    Spam,
    Falso
}

public enum TipoConteudo
{
    Ocorrencia = 1,
    Comentario,
    Foto
}

public enum AcaoModeracao
{
    Manter = 1,
    Remover
}

public enum AbaMinhas
{
    Registradas = 1,
    Afetado,
    Apoio
}

public enum FontePosicao
{
    Sptrans = 1,
    Passageiros
}

public enum MotivoEncerramentoViagem
{
    Usuario = 1,
    Expirada,
    ParadaForaDoTrajeto,
    NovaViagem,
    ContaExcluida
}
