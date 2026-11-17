using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

/// <summary>
/// Referência a uma imagem WebP no Firebase Storage. O domínio nunca recebe o arquivo,
/// só o caminho, que precisa estar na pasta do próprio usuário (doc 10, seção 3.1).
/// </summary>
public class Foto : IConteudoModeravel
{
    public const int MaximoPorRecurso = 3;
    public const int PathMaximo = 300;

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Path { get; private set; } = null!;
    public bool Oculta { get; private set; }

    bool IConteudoModeravel.EstaOculto => Oculta;

    private Foto() { }

    private Foto(string path) => Path = path;

    public static IReadOnlyList<Foto> CriarLista(IReadOnlyCollection<string>? paths, Usuario autor)
    {
        if (paths is null || paths.Count == 0)
            return [];
        if (paths.Count > MaximoPorRecurso)
            throw new DomainException(CodigosErro.LimiteFotosExcedido, $"Envie no máximo {MaximoPorRecurso} fotos.", "fotos");

        return paths.Select(p => Validar(p, autor.Uid!)).ToList();
    }

    private static Foto Validar(string? path, string uid)
    {
        var valido = !string.IsNullOrWhiteSpace(path)
                     && path.Length <= PathMaximo
                     && !path.Contains("..")
                     && path.EndsWith(".webp", StringComparison.OrdinalIgnoreCase)
                     && (path.StartsWith($"ocorrencias/{uid}/", StringComparison.Ordinal)
                         || path.StartsWith($"comentarios/{uid}/", StringComparison.Ordinal));
        if (!valido)
            throw new DomainException(CodigosErro.FotoInvalida, "Foto inválida. Envie imagens WebP da sua própria pasta.", "fotos");

        return new Foto(path!);
    }

    public void Ocultar() => Oculta = true;

    public void Reexibir() => Oculta = false;
}
