using Colecity.Application.Dtos;

namespace Colecity.Application.Abstractions;

/// <summary>Consultas agregadas (somente leitura) usadas pelo painel do poder público.</summary>
public interface IPainelConsultas
{
    Task<IndicadoresResponse> ObterIndicadoresAsync(CancellationToken ct = default);
}
