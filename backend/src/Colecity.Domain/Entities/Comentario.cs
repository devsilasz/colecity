namespace Colecity.Domain.Entities;

public class Comentario : EntidadeBase
{
    public const int TamanhoTexto = 500;

    public Guid OcorrenciaId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public string Texto { get; private set; } = null!;

    private Comentario() { }

    internal Comentario(Guid ocorrenciaId, Guid usuarioId, string texto)
    {
        OcorrenciaId = ocorrenciaId;
        UsuarioId = usuarioId;
        Texto = ValidarTexto(texto, "Comentário", TamanhoTexto);
    }
}
