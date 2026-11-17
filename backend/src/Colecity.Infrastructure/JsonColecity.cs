using System.Text.Json;
using System.Text.Json.Serialization;

namespace Colecity.Infrastructure;

/// <summary>Convenções JSON do contrato: camelCase e enums em UPPER_SNAKE_CASE (doc 10, seção 1).</summary>
public static class JsonColecity
{
    public static JsonSerializerOptions Opcoes { get; } = Configurar(new JsonSerializerOptions(JsonSerializerDefaults.Web));

    public static JsonSerializerOptions Configurar(JsonSerializerOptions opcoes)
    {
        opcoes.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        opcoes.Converters.Add(new JsonStringEnumConverter(JsonNamingPolicy.SnakeCaseUpper, allowIntegerValues: false));
        return opcoes;
    }
}
