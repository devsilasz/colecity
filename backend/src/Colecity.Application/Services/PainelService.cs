using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public class PainelService(IPainelConsultas consultas, IOcorrenciaRepository ocorrencias) : IPainelService
{
    public Task<IndicadoresResponse> ObterIndicadoresAsync(CancellationToken ct = default) =>
        consultas.ObterIndicadoresAsync(ct);

    /// <summary>Onde agir primeiro: ocorrências ativas ordenadas pela prioridade de cada módulo.</summary>
    public async Task<IReadOnlyList<OcorrenciaResponse>> ObterRankingAsync(Modulo? modulo, int top, CancellationToken ct = default)
    {
        var ativas = await ocorrencias.ListarNaoResolvidasAsync(ct);
        return ativas
            .Where(o => modulo is null || o.Modulo == modulo)
            .OrderByDescending(o => o.CalcularPrioridade())
            .ThenByDescending(o => o.TotalApoios)
            .ThenBy(o => o.CriadoEm)
            .Take(Math.Clamp(top, 1, 50))
            .Select(OcorrenciaResponse.De)
            .ToList();
    }
}
