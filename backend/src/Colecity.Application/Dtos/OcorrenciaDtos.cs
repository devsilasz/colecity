using System.ComponentModel.DataAnnotations;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

/// <summary>
/// Dados para registrar uma ocorrência. Os campos específicos dependem do módulo:
/// Transporte exige CodigoLinha e TipoProblema; Vias exige PontoReferencia;
/// Energia e Agua aceitam DuracaoEstimadaHoras.
/// </summary>
public sealed record CriarOcorrenciaRequest
{
    [Required, EnumDataType(typeof(Modulo))]
    public Modulo? Modulo { get; init; }

    [Required]
    public Guid AutorId { get; init; }

    /// <example>Ônibus não passa depois das 22h</example>
    [Required, StringLength(Ocorrencia.TamanhoTitulo)]
    public string Titulo { get; init; } = "";

    /// <example>Espero mais de 1 hora no ponto da Estrada do M'Boi Mirim.</example>
    [Required, StringLength(Ocorrencia.TamanhoDescricao)]
    public string Descricao { get; init; } = "";

    /// <example>Jardim Ângela</example>
    [Required, StringLength(Usuario.TamanhoBairro)]
    public string Bairro { get; init; } = "";

    /// <example>6072-10</example>
    [StringLength(OcorrenciaTransporte.TamanhoCodigoLinha)]
    public string? CodigoLinha { get; init; }

    [EnumDataType(typeof(TipoProblemaTransporte))]
    public TipoProblemaTransporte? TipoProblema { get; init; }

    [Range(0, 720)]
    public int? DuracaoEstimadaHoras { get; init; }

    [StringLength(OcorrenciaVia.TamanhoPontoReferencia)]
    public string? PontoReferencia { get; init; }
}

public sealed record EditarOcorrenciaRequest
{
    [Required]
    public Guid UsuarioId { get; init; }

    [Required, StringLength(Ocorrencia.TamanhoTitulo)]
    public string Titulo { get; init; } = "";

    [Required, StringLength(Ocorrencia.TamanhoDescricao)]
    public string Descricao { get; init; } = "";
}

/// <summary>Identifica o usuário que executa a ação (apoiar, confirmar resolução).</summary>
public sealed record AcaoUsuarioRequest
{
    [Required]
    public Guid UsuarioId { get; init; }
}

public sealed record ComentarRequest
{
    [Required]
    public Guid UsuarioId { get; init; }

    /// <example>Aqui também! Hoje esperei 50 minutos.</example>
    [Required, StringLength(Comentario.TamanhoTexto)]
    public string Texto { get; init; } = "";
}

public sealed record OcorrenciaResponse(
    Guid Id,
    Modulo Modulo,
    string Titulo,
    string Descricao,
    string Bairro,
    string Resumo,
    StatusOcorrencia Status,
    int TotalApoios,
    int ApoiosParaAbaixoAssinado,
    int Prioridade,
    Guid AutorId,
    DateTime CriadaEm,
    DateTime? ResolvidaEm,
    string? CodigoLinha = null,
    TipoProblemaTransporte? TipoProblema = null,
    int? DuracaoEstimadaHoras = null,
    string? PontoReferencia = null)
{
    public static OcorrenciaResponse De(Ocorrencia o)
    {
        var resposta = new OcorrenciaResponse(o.Id, o.Modulo, o.Titulo, o.Descricao, o.Bairro, o.Resumir(),
            o.Status, o.TotalApoios, o.ApoiosParaAbaixoAssinado, o.CalcularPrioridade(), o.AutorId,
            o.CriadoEm, o.ResolvidaEm);

        return o switch
        {
            OcorrenciaTransporte t => resposta with { CodigoLinha = t.CodigoLinha, TipoProblema = t.TipoProblema },
            OcorrenciaInterrupcaoServico s => resposta with { DuracaoEstimadaHoras = s.DuracaoEstimadaHoras },
            OcorrenciaVia v => resposta with { PontoReferencia = v.PontoReferencia },
            _ => resposta
        };
    }
}

public sealed record ComentarioResponse(Guid Id, Guid UsuarioId, string Texto, DateTime CriadoEm)
{
    public static ComentarioResponse De(Comentario c) => new(c.Id, c.UsuarioId, c.Texto, c.CriadoEm);
}

public sealed record PaginaResponse<T>(IReadOnlyList<T> Itens, int Pagina, int TamanhoPagina, int Total)
{
    public int TotalPaginas => (int)Math.Ceiling(Total / (double)TamanhoPagina);
}
