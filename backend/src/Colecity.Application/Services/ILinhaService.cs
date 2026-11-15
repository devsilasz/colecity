using Colecity.Application.Dtos;

namespace Colecity.Application.Services;

public interface ILinhaService
{
    Task<IReadOnlyList<LinhaResponse>> BuscarAsync(string termo, CancellationToken ct = default);
    Task<SituacaoLinhaResponse> ObterSituacaoAsync(string letreiro, CancellationToken ct = default);
}
