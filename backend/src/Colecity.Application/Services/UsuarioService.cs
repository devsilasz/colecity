using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IUsuarioService
{
    Task<UsuarioResponse> SalvarCadastroAsync(CadastroUsuarioRequest request, CancellationToken ct = default);
    Task<UsuarioResponse> ObterAsync(CancellationToken ct = default);
    Task<UsuarioResponse> AtualizarAsync(AtualizacaoUsuarioRequest request, CancellationToken ct = default);
    Task ExcluirContaAsync(CancellationToken ct = default);
    Task<Pagina<OcorrenciaResumoResponse>> MinhasOcorrenciasAsync(AbaMinhas aba, int? page, int? pageSize, CancellationToken ct = default);
}

public class UsuarioService(
    ContextoUsuario contexto,
    IUsuarioRepository usuarios,
    IOcorrenciaRepository ocorrencias,
    IViagemRepository viagens,
    IOcorrenciaConsultas consultas,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IUsuarioService
{
    /// <summary>Cria no primeiro acesso ou atualiza o cadastro (chamado pelo BFF após o login).</summary>
    public async Task<UsuarioResponse> SalvarCadastroAsync(CadastroUsuarioRequest request, CancellationToken ct = default)
    {
        var uid = contexto.Uid!;
        var usuario = await usuarios.ObterPorUidAsync(uid, ct);
        await GarantirEmailLivreAsync(request.Email, usuario?.Id, ct);

        if (usuario is null)
        {
            usuario = Usuario.Cadastrar(uid, request.Nome, request.Email, request.AceiteTermosVersao, Agora);
            await usuarios.AdicionarAsync(usuario, ct);
        }
        else
        {
            usuario.AlterarNome(request.Nome);
            usuario.AlterarEmail(request.Email);
            if (request.AceiteTermosVersao is not null)
                usuario.AceitarTermos(request.AceiteTermosVersao);
        }

        await unitOfWork.SalvarAsync(ct);
        return UsuarioResponse.De(usuario);
    }

    public async Task<UsuarioResponse> ObterAsync(CancellationToken ct = default) =>
        UsuarioResponse.De(await contexto.ObterObrigatorioAsync(ct));

    /// <summary>O BFF só envia o e-mail depois que a troca foi concluída no Firebase Auth (RN-CON-07).</summary>
    public async Task<UsuarioResponse> AtualizarAsync(AtualizacaoUsuarioRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        if (request.Nome is not null)
            usuario.AlterarNome(request.Nome);
        if (request.Email is not null)
        {
            await GarantirEmailLivreAsync(request.Email, usuario.Id, ct);
            usuario.AlterarEmail(request.Email);
        }

        await unitOfWork.SalvarAsync(ct);
        return UsuarioResponse.De(usuario);
    }

    /// <summary>Anonimização (RN-CON-08): dados pessoais, participações e viagens saem; relatos ficam como "Usuário removido".</summary>
    public async Task ExcluirContaAsync(CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);

        foreach (var ocorrencia in await ocorrencias.ListarComParticipacaoDeAsync(usuario.Id, ct))
            ocorrencia.RemoverParticipacoesDe(usuario.Id);
        foreach (var viagem in await viagens.ListarDoUsuarioAsync(usuario.Id, ct))
            viagens.Remover(viagem);

        usuario.Anonimizar();
        await unitOfWork.SalvarAsync(ct);
    }

    public async Task<Pagina<OcorrenciaResumoResponse>> MinhasOcorrenciasAsync(AbaMinhas aba, int? page, int? pageSize, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var (pagina, tamanho) = Pagina<OcorrenciaResumoResponse>.Normalizar(page, pageSize);
        return await consultas.MinhasAsync(usuario.Id, aba, pagina, tamanho, ct);
    }

    private DateTime Agora => relogio.GetUtcNow().UtcDateTime;

    private async Task GarantirEmailLivreAsync(string? email, Guid? usuarioId, CancellationToken ct)
    {
        var normalizado = email?.Trim().ToLowerInvariant();
        if (!string.IsNullOrEmpty(normalizado) && await usuarios.EmailEmUsoAsync(normalizado, usuarioId, ct))
            throw new ConflitoException(CodigosErro.EmailJaCadastrado, "Este e-mail já está cadastrado em outra conta.");
    }
}
