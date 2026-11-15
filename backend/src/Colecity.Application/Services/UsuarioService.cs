using Colecity.Application.Dtos;
using Colecity.Application.Exceptions;
using Colecity.Domain.Entities;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public class UsuarioService(IUsuarioRepository usuarios, IUnitOfWork unitOfWork) : IUsuarioService
{
    public async Task<UsuarioResponse> CriarAsync(CriarUsuarioRequest request, CancellationToken ct = default)
    {
        var usuario = new Usuario(request.Nome, request.Email, request.Bairro);
        if (await usuarios.EmailEmUsoAsync(usuario.Email, ct))
            throw new ConflitoException("Já existe um usuário com este e-mail.");

        await usuarios.AdicionarAsync(usuario, ct);
        await unitOfWork.SalvarAsync(ct);
        return UsuarioResponse.De(usuario);
    }

    public async Task<UsuarioResponse> ObterAsync(Guid id, CancellationToken ct = default)
    {
        var usuario = await usuarios.ObterPorIdAsync(id, ct)
            ?? throw new RecursoNaoEncontradoException("Usuário", id);
        return UsuarioResponse.De(usuario);
    }

    public async Task<IReadOnlyList<UsuarioResponse>> ListarAsync(CancellationToken ct = default) =>
        (await usuarios.ListarAsync(ct)).Select(UsuarioResponse.De).ToList();
}
