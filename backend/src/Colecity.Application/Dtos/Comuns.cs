using Colecity.Domain.Entities;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;

namespace Colecity.Application.Dtos;

/// <summary><c>{ "lat": -23.55, "lng": -46.63 }</c> (WGS84).</summary>
public sealed record CoordenadaDto(double Lat, double Lng)
{
    public static CoordenadaDto De(Coordenada c) => new(c.Lat, c.Lng);

    public Coordenada ParaDominio() => new(Lat, Lng);
}

/// <summary>Página de resultados: <c>?page=1&amp;pageSize=20</c> (máximo 50).</summary>
public sealed record Pagina<T>(IReadOnlyList<T> Items, int Page, int PageSize, int Total)
{
    public const int TamanhoPadrao = 20;
    public const int TamanhoMaximo = 50;

    public static (int Page, int PageSize) Normalizar(int? page, int? pageSize)
    {
        if (page is < 1 || pageSize is < 1 or > TamanhoMaximo)
            throw new RequisicaoInvalidaException($"Use page ≥ 1 e pageSize entre 1 e {TamanhoMaximo}.");
        return (page ?? 1, pageSize ?? TamanhoPadrao);
    }
}

/// <summary>Referência a uma foto já enviada ao Storage.</summary>
public sealed record FotoRefDto(string? Path);

public sealed record FotoResponse(Guid Id, string Path)
{
    public static FotoResponse De(Foto f) => new(f.Id, f.Path);
}

public static class FotoRefExtensions
{
    public static IReadOnlyCollection<string>? Paths(this IReadOnlyList<FotoRefDto>? fotos) =>
        fotos?.Select(f => f.Path ?? "").ToList();
}
