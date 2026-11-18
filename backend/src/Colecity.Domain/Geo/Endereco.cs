namespace Colecity.Domain.Geo;

/// <summary>Resultado da geocodificação reversa, usado no título da ocorrência (RN-REG-07).</summary>
public sealed record Endereco(string? Rua, string? Bairro);
