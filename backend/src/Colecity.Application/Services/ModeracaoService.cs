using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IModeracaoService
{
    Task<DenunciaResponse> DenunciarAsync(DenunciaRequest request, CancellationToken ct = default);
    Task<IReadOnlyList<ConteudoDenunciadoResponse>> ListarPendentesAsync(CancellationToken ct = default);
    Task DecidirAsync(Guid conteudoId, DecisaoModeracaoRequest request, CancellationToken ct = default);
}

/// <summary>Denúncias e moderação (RN-MOD).</summary>
public class ModeracaoService(
    ContextoUsuario contexto,
    IDenunciaRepository denuncias,
    IOcorrenciaRepository ocorrencias,
    IComentarioRepository comentarios,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IModeracaoService
{
    public async Task<DenunciaResponse> DenunciarAsync(DenunciaRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        new CamposObrigatorios()
            .Exigir(request.TipoConteudo, "tipoConteudo")
            .Exigir(request.ConteudoId, "conteudoId")
            .Exigir(request.Motivo, "motivo")
            .Validar();

        var (tipo, conteudoId) = (request.TipoConteudo!.Value, request.ConteudoId!.Value);
        var conteudo = await ObterConteudoAsync(tipo, conteudoId, ct) ?? throw new NaoEncontradoException("Conteúdo");
        if (await denuncias.ExisteAsync(tipo, conteudoId, usuario.Id, ct))
            throw new ConflitoException(CodigosErro.DenunciaJaRegistrada, "Você já denunciou este conteúdo.");

        var denuncia = new Denuncia(tipo, conteudoId, usuario.Id, request.Motivo!.Value, relogio.GetUtcNow().UtcDateTime);
        await denuncias.AdicionarAsync(denuncia, ct);

        // A denúncia atual ainda não está salva, por isso o +1 (RN-MOD-02).
        if (await denuncias.ContarContasPendentesAsync(tipo, conteudoId, ct) + 1 >= Denuncia.ContasParaOcultar)
            conteudo.Ocultar();

        await unitOfWork.SalvarAsync(ct);
        return new DenunciaResponse(denuncia.Id, tipo, conteudoId, denuncia.Motivo, denuncia.CriadoEm);
    }

    public async Task<IReadOnlyList<ConteudoDenunciadoResponse>> ListarPendentesAsync(CancellationToken ct = default)
    {
        var pendentes = await denuncias.ListarPendentesAsync(ct: ct);
        var resposta = new List<ConteudoDenunciadoResponse>();
        foreach (var grupo in pendentes.GroupBy(d => (d.TipoConteudo, d.ConteudoId)))
        {
            var conteudo = await ObterConteudoAsync(grupo.Key.TipoConteudo, grupo.Key.ConteudoId, ct);
            resposta.Add(new ConteudoDenunciadoResponse(
                grupo.Key.TipoConteudo,
                grupo.Key.ConteudoId,
                grupo.Select(d => d.UsuarioId).Distinct().Count(),
                grupo.GroupBy(d => d.Motivo).Select(m => new MotivoContagemResponse(m.Key, m.Count())).ToList(),
                conteudo?.EstaOculto ?? true,
                grupo.Max(d => d.CriadoEm)));
        }
        return resposta.OrderByDescending(c => c.TotalContas).ThenByDescending(c => c.UltimaDenunciaEm).ToList();
    }

    /// <summary>Revisão da equipe Colecity: manter reexibe o conteúdo; remover o mantém oculto.</summary>
    public async Task DecidirAsync(Guid conteudoId, DecisaoModeracaoRequest request, CancellationToken ct = default)
    {
        new CamposObrigatorios().Exigir(request.Acao, "acao").Validar();

        var pendentes = await denuncias.ListarPendentesAsync(conteudoId, ct);
        if (pendentes.Count == 0)
            throw new NaoEncontradoException("Denúncia pendente");

        var conteudo = await ObterConteudoAsync(pendentes[0].TipoConteudo, conteudoId, ct);
        if (request.Acao == AcaoModeracao.Manter)
            conteudo?.Reexibir();
        else
            conteudo?.Ocultar();

        foreach (var denuncia in pendentes)
            denuncia.MarcarRevisada();
        await unitOfWork.SalvarAsync(ct);
    }

    private async Task<IConteudoModeravel?> ObterConteudoAsync(TipoConteudo tipo, Guid id, CancellationToken ct) => tipo switch
    {
        TipoConteudo.Ocorrencia => await ocorrencias.ObterAsync(id, ct),
        TipoConteudo.Comentario => await comentarios.ObterAsync(id, ct),
        _ => await ocorrencias.ObterFotoAsync(id, ct)
    };
}
