using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;

namespace Colecity.Application.Services;

public interface IMapaService
{
    Task<IReadOnlyList<PontoCalorResponse>> CalorAsync(AreaMapa area, Categoria? categoria, CancellationToken ct = default);
    Task<IReadOnlyList<ZonaAtencaoResponse>> ZonasAsync(AreaMapa area, CancellationToken ct = default);
}

/// <summary>Área visível do mapa, como chega na query string.</summary>
public sealed record AreaMapa(double? MinLat, double? MinLng, double? MaxLat, double? MaxLng)
{
    public CaixaDelimitadora Validar()
    {
        if (MinLat is not { } minLat || MinLng is not { } minLng || MaxLat is not { } maxLat || MaxLng is not { } maxLng)
            throw new RequisicaoInvalidaException("Informe minLat, minLng, maxLat e maxLng.");
        if (minLat >= maxLat || minLng >= maxLng)
            throw new RequisicaoInvalidaException("A área do mapa é inválida.");
        return new CaixaDelimitadora(minLat, minLng, maxLat, maxLng);
    }
}

/// <summary>Mapa de calor (RN-DES-01) e Zonas de atenção (RN-ZON).</summary>
public class MapaService(IMapaConsultas consultas) : IMapaService
{
    public Task<IReadOnlyList<PontoCalorResponse>> CalorAsync(AreaMapa area, Categoria? categoria, CancellationToken ct = default) =>
        consultas.CalorAsync(area.Validar(), categoria, ct);

    public Task<IReadOnlyList<ZonaAtencaoResponse>> ZonasAsync(AreaMapa area, CancellationToken ct = default) =>
        consultas.ZonasAsync(area.Validar(), ct);
}
