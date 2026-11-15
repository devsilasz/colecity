using Colecity.Application.Dtos;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IOcorrenciaService
{
    Task<OcorrenciaResponse> CriarAsync(CriarOcorrenciaRequest request, CancellationToken ct = default);
    Task<OcorrenciaResponse> ObterAsync(Guid id, CancellationToken ct = default);
    Task<PaginaResponse<OcorrenciaResponse>> ListarAsync(FiltroOcorrencias filtro, CancellationToken ct = default);
    Task<OcorrenciaResponse> EditarAsync(Guid id, EditarOcorrenciaRequest request, CancellationToken ct = default);
    Task ExcluirAsync(Guid id, Guid usuarioId, CancellationToken ct = default);
    Task<OcorrenciaResponse> ApoiarAsync(Guid id, Guid usuarioId, CancellationToken ct = default);
    Task<OcorrenciaResponse> ConfirmarResolucaoAsync(Guid id, Guid usuarioId, CancellationToken ct = default);
    Task<ComentarioResponse> ComentarAsync(Guid id, ComentarRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ComentarioResponse>> ListarComentariosAsync(Guid id, CancellationToken ct = default);
}
