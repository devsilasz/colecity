using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IParticipacaoService
{
    Task<ParticipacaoResponse> MarcarAsync(Guid ocorrenciaId, TipoParticipacao tipo, CancellationToken ct = default);

    /// <summary>Devolve <c>null</c> quando não havia participação para retirar.</summary>
    Task<ParticipacaoResponse?> RetirarAsync(Guid ocorrenciaId, TipoParticipacao tipo, CancellationToken ct = default);
}

/// <summary>"Também estou sendo afetado" e "Apoiar manifestação" (RN-PAR).</summary>
public class ParticipacaoService(
    ContextoUsuario contexto,
    IOcorrenciaRepository ocorrencias,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IParticipacaoService
{
    public async Task<ParticipacaoResponse> MarcarAsync(Guid ocorrenciaId, TipoParticipacao tipo, CancellationToken ct = default)
    {
        var (usuario, ocorrencia) = await CarregarAsync(ocorrenciaId, ct);
        ocorrencia.MarcarParticipacao(usuario, tipo, relogio.GetUtcNow().UtcDateTime);
        await unitOfWork.SalvarAsync(ct);
        return Resposta(ocorrencia, usuario);
    }

    public async Task<ParticipacaoResponse?> RetirarAsync(Guid ocorrenciaId, TipoParticipacao tipo, CancellationToken ct = default)
    {
        var (usuario, ocorrencia) = await CarregarAsync(ocorrenciaId, ct);
        if (!ocorrencia.RetirarParticipacao(usuario, tipo, relogio.GetUtcNow().UtcDateTime))
            return null;

        await unitOfWork.SalvarAsync(ct);
        return Resposta(ocorrencia, usuario);
    }

    private async Task<(Usuario, Ocorrencia)> CarregarAsync(Guid ocorrenciaId, CancellationToken ct)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var ocorrencia = await ocorrencias.ObterAsync(ocorrenciaId, ct);
        if (ocorrencia is null || ocorrencia.Oculta)
            throw new NaoEncontradoException("Ocorrência");
        return (usuario, ocorrencia);
    }

    private static ParticipacaoResponse Resposta(Ocorrencia o, Usuario u) => new(
        o.TotalAfetados,
        o.TotalApoios,
        new MinhaParticipacaoResponse(o.Participa(u.Id, TipoParticipacao.Afetado), o.Participa(u.Id, TipoParticipacao.Apoio), o.EhAutor(u.Id)));
}
