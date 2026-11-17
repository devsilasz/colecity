using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

/// <summary>Comentário no fórum da ocorrência (RN-COM). Não há edição.</summary>
public class Comentario : EntidadeBase, IConteudoModeravel
{
    public const int TextoMaximo = 500;

    private readonly List<Foto> _fotos = [];

    public Guid OcorrenciaId { get; private set; }
    public Guid AutorId { get; private set; }
    public string Texto { get; private set; } = null!;
    public bool Oculto { get; private set; }
    public IReadOnlyCollection<Foto> Fotos => _fotos.AsReadOnly();

    bool IConteudoModeravel.EstaOculto => Oculto;

    private Comentario() { }

    internal Comentario(Guid ocorrenciaId, Usuario autor, string? texto, IReadOnlyCollection<string>? fotos, DateTime agora)
    {
        var conteudo = texto?.Trim() ?? "";
        if (conteudo.Length is < 1 or > TextoMaximo)
            throw new DomainException(CodigosErro.ComentarioTamanhoInvalido,
                $"O comentário deve ter entre 1 e {TextoMaximo} caracteres.", "texto");

        OcorrenciaId = ocorrenciaId;
        AutorId = autor.Id;
        Texto = conteudo;
        CriadoEm = agora;
        _fotos.AddRange(Foto.CriarLista(fotos, autor));
    }

    public void GarantirQuePodeSerExcluidoPor(Guid usuarioId)
    {
        if (usuarioId != AutorId)
            throw new AcessoNegadoException(CodigosErro.SomenteAutor, "Apenas o autor pode excluir o comentário.");
    }

    public void Ocultar() => Oculto = true;

    public void Reexibir() => Oculto = false;
}
