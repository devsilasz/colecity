using Colecity.Application.Dtos;
using Colecity.Domain.Enums;

namespace Colecity.Application.Services;

public interface IPainelService
{
    Task<IndicadoresResponse> ObterIndicadoresAsync(CancellationToken ct = default);
    Task<IReadOnlyList<OcorrenciaResponse>> ObterRankingAsync(Modulo? modulo, int top, CancellationToken ct = default);
}
