using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

/// <summary>"Também estou sendo afetado" ou "Apoiar manifestação" (RN-PAR).</summary>
public class Participacao : EntidadeBase
{
    public Guid OcorrenciaId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public TipoParticipacao Tipo { get; private set; }

    private Participacao() { }

    internal Participacao(Guid ocorrenciaId, Guid usuarioId, TipoParticipacao tipo, DateTime agora)
    {
        OcorrenciaId = ocorrenciaId;
        UsuarioId = usuarioId;
        Tipo = tipo;
        CriadoEm = agora;
    }
}
