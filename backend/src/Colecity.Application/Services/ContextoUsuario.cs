using Colecity.Application.Abstractions;
using Colecity.Domain.Entities;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

/// <summary>Resolve, uma vez por requisição, o usuário do domínio a partir do <c>uid</c> do Firebase.</summary>
public sealed class ContextoUsuario(IUsuarioAtual usuarioAtual, IUsuarioRepository usuarios)
{
    private Usuario? _usuario;
    private bool _carregado;

    public string? Uid => usuarioAtual.Uid;

    /// <summary>Usuário cadastrado e ativo, ou <c>null</c> para visitantes.</summary>
    public async Task<Usuario?> ObterOpcionalAsync(CancellationToken ct = default)
    {
        if (!_carregado && Uid is { } uid)
            _usuario = await usuarios.ObterPorUidAsync(uid, ct);
        _carregado = true;
        return _usuario is { Removido: false } ? _usuario : null;
    }

    /// <summary>Conta anonimizada ou inexistente → <c>403 USUARIO_NAO_CADASTRADO</c> (doc 10, seção 1.1).</summary>
    public async Task<Usuario> ObterObrigatorioAsync(CancellationToken ct = default) =>
        await ObterOpcionalAsync(ct)
        ?? throw new AcessoNegadoException(CodigosErro.UsuarioNaoCadastrado, "Conclua seu cadastro para continuar.");
}
