using System.Text.Json;
using Colecity.Domain.Geo;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Colecity.Infrastructure.Data.Configurations;

/// <summary>Guarda listas de coordenadas (trechos de desvio) como JSON em uma coluna.</summary>
internal static class ConversoresJson
{
    public static PropertyBuilder<List<Coordenada>?> ComoJson(this PropertyBuilder<List<Coordenada>?> propriedade) =>
        propriedade.HasConversion(
            lista => Serializar(lista),
            json => Desserializar(json),
            new ValueComparer<List<Coordenada>?>(
                (a, b) => Iguais(a, b),
                lista => lista == null ? 0 : lista.Count,
                lista => lista == null ? null : lista.ToList()));

    private static string? Serializar(List<Coordenada>? lista) =>
        lista is null ? null : JsonSerializer.Serialize(lista, JsonColecity.Opcoes);

    private static List<Coordenada>? Desserializar(string? json) =>
        json is null ? null : JsonSerializer.Deserialize<List<Coordenada>>(json, JsonColecity.Opcoes);

    private static bool Iguais(List<Coordenada>? a, List<Coordenada>? b) =>
        a is null ? b is null : b is not null && a.SequenceEqual(b);
}
