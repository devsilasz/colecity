using System.Globalization;
using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Colecity.Application.Abstractions;
using Colecity.Domain.Geo;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Logging;

namespace Colecity.Infrastructure.Geocodificacao;

public class GeocodificacaoOptions
{
    public const string Secao = "Geocodificacao";

    /// <summary><c>Nominatim</c> (OpenStreetMap, sem token) ou <c>Simulado</c> (bairro mais próximo, offline).</summary>
    public string Provedor { get; set; } = "Nominatim";

    public string NominatimUrl { get; set; } = "https://nominatim.openstreetmap.org/";
    public int TimeoutSegundos { get; set; } = 3;
}

/// <summary>
/// Geocodificação reversa pelo Nominatim (OpenStreetMap). Falhas não impedem o registro: devolve
/// <c>null</c> e o título é completado depois pela tarefa de geocodificação pendente.
/// </summary>
public class NominatimGeocodificador(HttpClient http, IMemoryCache cache, ILogger<NominatimGeocodificador> logger) : IGeocodificador
{
    private static readonly TimeSpan Validade = TimeSpan.FromDays(1);

    public async Task<Endereco?> ObterEnderecoAsync(Coordenada local, CancellationToken ct = default)
    {
        // A chave usa a localização aproximada (~100 m): pontos vizinhos reaproveitam o resultado.
        var aproximada = local.Aproximada();
        var chave = $"geo:{aproximada.Lat.ToString(CultureInfo.InvariantCulture)},{aproximada.Lng.ToString(CultureInfo.InvariantCulture)}";
        if (cache.TryGetValue(chave, out Endereco? emCache))
            return emCache;

        try
        {
            var lat = local.Lat.ToString(CultureInfo.InvariantCulture);
            var lng = local.Lng.ToString(CultureInfo.InvariantCulture);
            var resposta = await http.GetFromJsonAsync<RespostaNominatim>(
                $"reverse?format=jsonv2&zoom=18&addressdetails=1&accept-language=pt-BR&lat={lat}&lon={lng}", ct);

            var endereco = resposta?.Endereco is { } e
                ? new Endereco(e.Rua, e.Bairro ?? e.Vizinhanca ?? e.Distrito ?? e.Quarteirao)
                : null;
            if (endereco is { Rua: null, Bairro: null })
                endereco = null;

            cache.Set(chave, endereco, Validade);
            return endereco;
        }
        catch (Exception ex) when (ex is not OperationCanceledException || !ct.IsCancellationRequested)
        {
            logger.LogWarning("Geocodificação indisponível ({Erro}); o título será completado depois", ex.GetType().Name);
            return null;
        }
    }

    private sealed record RespostaNominatim([property: JsonPropertyName("address")] EnderecoNominatim? Endereco);

    private sealed record EnderecoNominatim(
        [property: JsonPropertyName("road")] string? Rua,
        [property: JsonPropertyName("suburb")] string? Bairro,
        [property: JsonPropertyName("neighbourhood")] string? Vizinhanca,
        [property: JsonPropertyName("city_district")] string? Distrito,
        [property: JsonPropertyName("quarter")] string? Quarteirao);
}

/// <summary>Alternativa offline: devolve o bairro de referência mais próximo, sem rua.</summary>
public class GeocodificadorSimulado : IGeocodificador
{
    private static readonly (string Bairro, Coordenada Centro)[] Bairros =
    [
        ("Sé", new(-23.5503, -46.6339)), ("República", new(-23.5432, -46.6420)), ("Mooca", new(-23.5580, -46.5990)),
        ("Pinheiros", new(-23.5670, -46.7020)), ("Lapa", new(-23.5260, -46.7030)), ("Água Branca", new(-23.5250, -46.6880)),
        ("Perdizes", new(-23.5370, -46.6790)), ("Butantã", new(-23.5710, -46.7090)), ("Santana", new(-23.5020, -46.6250)),
        ("Penha", new(-23.5260, -46.5440)), ("Itaquera", new(-23.5410, -46.4710)), ("Cidade Tiradentes", new(-23.5820, -46.4030)),
        ("Vila Mariana", new(-23.5890, -46.6340)), ("Santo Amaro", new(-23.6530, -46.7100)), ("Capão Redondo", new(-23.6700, -46.7790)),
        ("Jardim Ângela", new(-23.7050, -46.7700)), ("Grajaú", new(-23.7700, -46.6800)), ("Campo Limpo", new(-23.6480, -46.7590))
    ];

    public Task<Endereco?> ObterEnderecoAsync(Coordenada local, CancellationToken ct = default)
    {
        var maisProximo = Bairros.MinBy(b => b.Centro.DistanciaMetros(local));
        return Task.FromResult<Endereco?>(new Endereco(null, maisProximo.Bairro));
    }
}
