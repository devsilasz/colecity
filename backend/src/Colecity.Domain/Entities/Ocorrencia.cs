using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

/// <summary>
/// Problema urbano relatado por um cidadão. Cada módulo é uma especialização com suas
/// próprias regras de urgência e de quantos apoios são necessários para virar abaixo-assinado.
/// </summary>
public abstract class Ocorrencia : EntidadeBase
{
    public const int TamanhoTitulo = 120;
    public const int TamanhoDescricao = 1000;

    private readonly List<Apoio> _apoios = [];
    private readonly List<Comentario> _comentarios = [];

    public Modulo Modulo { get; private set; }
    public string Titulo { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public string Bairro { get; private set; } = null!;
    public Guid AutorId { get; private set; }
    public StatusOcorrencia Status { get; private set; } = StatusOcorrencia.Aberta;
    public DateTime? ResolvidaEm { get; private set; }

    public IReadOnlyCollection<Apoio> Apoios => _apoios.AsReadOnly();
    public IReadOnlyCollection<Comentario> Comentarios => _comentarios.AsReadOnly();

    public int TotalApoios => _apoios.Count;

    /// <summary>Quantos apoios a ocorrência precisa para virar abaixo-assinado.</summary>
    public abstract int ApoiosParaAbaixoAssinado { get; }

    /// <summary>Peso usado no ranking: problemas de serviços essenciais pesam mais.</summary>
    public abstract int PesoUrgencia { get; }

    protected Ocorrencia() { }

    protected Ocorrencia(Modulo modulo, string titulo, string descricao, string bairro, Guid autorId)
    {
        if (autorId == Guid.Empty)
            throw new DomainException("Autor é obrigatório.");

        Modulo = modulo;
        AutorId = autorId;
        Bairro = ValidarTexto(bairro, "Bairro", Usuario.TamanhoBairro);
        AtualizarTextos(titulo, descricao);

        // Quem relata o problema é o primeiro a assinar o abaixo-assinado.
        _apoios.Add(new Apoio(Id, autorId));
    }

    /// <summary>Texto curto que identifica a ocorrência dentro do seu módulo.</summary>
    public abstract string Resumir();

    public int CalcularPrioridade() =>
        Status == StatusOcorrencia.Resolvida ? 0 : TotalApoios * PesoUrgencia;

    public bool FoiApoiadaPor(Guid usuarioId) => _apoios.Any(a => a.UsuarioId == usuarioId);

    public Apoio Apoiar(Guid usuarioId)
    {
        GarantirNaoResolvida();
        if (FoiApoiadaPor(usuarioId))
            throw new DomainException("Usuário já apoia esta ocorrência.");

        var apoio = new Apoio(Id, usuarioId);
        _apoios.Add(apoio);

        if (Status == StatusOcorrencia.Aberta && TotalApoios >= ApoiosParaAbaixoAssinado)
            Status = StatusOcorrencia.AbaixoAssinado;

        return apoio;
    }

    public Comentario Comentar(Guid usuarioId, string texto)
    {
        var comentario = new Comentario(Id, usuarioId, texto);
        _comentarios.Add(comentario);
        return comentario;
    }

    /// <summary>Somente quem apoia a ocorrência pode confirmar que ela foi resolvida.</summary>
    public void ConfirmarResolucao(Guid usuarioId, DateTime agora)
    {
        GarantirNaoResolvida();
        if (!FoiApoiadaPor(usuarioId))
            throw new DomainException("Apenas apoiadores podem confirmar a resolução.");

        Status = StatusOcorrencia.Resolvida;
        ResolvidaEm = agora;
    }

    public void Editar(Guid usuarioId, string titulo, string descricao)
    {
        GarantirAutor(usuarioId);
        GarantirNaoResolvida();
        AtualizarTextos(titulo, descricao);
    }

    /// <summary>O autor só pode excluir enquanto ninguém mais assinou o relato.</summary>
    public void GarantirQuePodeSerExcluidaPor(Guid usuarioId)
    {
        GarantirAutor(usuarioId);
        if (TotalApoios > 1)
            throw new DomainException("Ocorrência com apoio de outros usuários não pode ser excluída.");
    }

    private void AtualizarTextos(string titulo, string descricao)
    {
        Titulo = ValidarTexto(titulo, "Título", TamanhoTitulo);
        Descricao = ValidarTexto(descricao, "Descrição", TamanhoDescricao);
    }

    private void GarantirAutor(Guid usuarioId)
    {
        if (usuarioId != AutorId)
            throw new DomainException("Apenas o autor pode alterar esta ocorrência.");
    }

    private void GarantirNaoResolvida()
    {
        if (Status == StatusOcorrencia.Resolvida)
            throw new DomainException("Ocorrência já foi resolvida.");
    }
}
