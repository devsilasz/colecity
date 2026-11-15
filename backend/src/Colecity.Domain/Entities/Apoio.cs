namespace Colecity.Domain.Entities;

/// <summary>Assinatura de um usuário no abaixo-assinado de uma ocorrência.</summary>
public class Apoio : EntidadeBase
{
    public Guid OcorrenciaId { get; private set; }
    public Guid UsuarioId { get; private set; }

    private Apoio() { }

    internal Apoio(Guid ocorrenciaId, Guid usuarioId)
    {
        OcorrenciaId = ocorrenciaId;
        UsuarioId = usuarioId;
    }
}
