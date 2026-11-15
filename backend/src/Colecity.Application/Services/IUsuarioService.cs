using Colecity.Application.Dtos;

namespace Colecity.Application.Services;

public interface IUsuarioService
{
    Task<UsuarioResponse> CriarAsync(CriarUsuarioRequest request, CancellationToken ct = default);
    Task<UsuarioResponse> ObterAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<UsuarioResponse>> ListarAsync(CancellationToken ct = default);
}
