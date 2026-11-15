using Colecity.Application.Dtos;
using Colecity.Application.Exceptions;
using Colecity.Domain.Entities;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public class OcorrenciaService(
    IOcorrenciaRepository ocorrencias,
    IUsuarioRepository usuarios,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IOcorrenciaService
{
    private const int TamanhoMaximoPagina = 100;

    public async Task<OcorrenciaResponse> CriarAsync(CriarOcorrenciaRequest request, CancellationToken ct = default)
    {
        await GarantirUsuarioExisteAsync(request.AutorId, ct);

        var ocorrencia = OcorrenciaFactory.Criar(request);
        await ocorrencias.AdicionarAsync(ocorrencia, ct);
        await unitOfWork.SalvarAsync(ct);
        return OcorrenciaResponse.De(ocorrencia);
    }

    public async Task<OcorrenciaResponse> ObterAsync(Guid id, CancellationToken ct = default) =>
        OcorrenciaResponse.De(await CarregarAsync(id, ct));

    public async Task<PaginaResponse<OcorrenciaResponse>> ListarAsync(FiltroOcorrencias filtro, CancellationToken ct = default)
    {
        var normalizado = filtro with
        {
            Pagina = Math.Max(1, filtro.Pagina),
            TamanhoPagina = Math.Clamp(filtro.TamanhoPagina, 1, TamanhoMaximoPagina)
        };

        var (itens, total) = await ocorrencias.ListarAsync(normalizado, ct);
        return new PaginaResponse<OcorrenciaResponse>(
            itens.Select(OcorrenciaResponse.De).ToList(), normalizado.Pagina, normalizado.TamanhoPagina, total);
    }

    public async Task<OcorrenciaResponse> EditarAsync(Guid id, EditarOcorrenciaRequest request, CancellationToken ct = default)
    {
        var ocorrencia = await CarregarAsync(id, ct);
        ocorrencia.Editar(request.UsuarioId, request.Titulo, request.Descricao);
        await unitOfWork.SalvarAsync(ct);
        return OcorrenciaResponse.De(ocorrencia);
    }

    public async Task ExcluirAsync(Guid id, Guid usuarioId, CancellationToken ct = default)
    {
        var ocorrencia = await CarregarAsync(id, ct);
        ocorrencia.GarantirQuePodeSerExcluidaPor(usuarioId);
        ocorrencias.Remover(ocorrencia);
        await unitOfWork.SalvarAsync(ct);
    }

    public async Task<OcorrenciaResponse> ApoiarAsync(Guid id, Guid usuarioId, CancellationToken ct = default)
    {
        await GarantirUsuarioExisteAsync(usuarioId, ct);
        var ocorrencia = await CarregarAsync(id, ct);
        ocorrencia.Apoiar(usuarioId);
        await unitOfWork.SalvarAsync(ct);
        return OcorrenciaResponse.De(ocorrencia);
    }

    public async Task<OcorrenciaResponse> ConfirmarResolucaoAsync(Guid id, Guid usuarioId, CancellationToken ct = default)
    {
        var ocorrencia = await CarregarAsync(id, ct);
        ocorrencia.ConfirmarResolucao(usuarioId, relogio.GetUtcNow().UtcDateTime);
        await unitOfWork.SalvarAsync(ct);
        return OcorrenciaResponse.De(ocorrencia);
    }

    public async Task<ComentarioResponse> ComentarAsync(Guid id, ComentarRequest request, CancellationToken ct = default)
    {
        await GarantirUsuarioExisteAsync(request.UsuarioId, ct);
        var ocorrencia = await CarregarAsync(id, ct);
        var comentario = ocorrencia.Comentar(request.UsuarioId, request.Texto);
        await unitOfWork.SalvarAsync(ct);
        return ComentarioResponse.De(comentario);
    }

    public async Task<IReadOnlyList<ComentarioResponse>> ListarComentariosAsync(Guid id, CancellationToken ct = default)
    {
        var ocorrencia = await CarregarAsync(id, ct);
        return ocorrencia.Comentarios
            .OrderBy(c => c.CriadoEm)
            .Select(ComentarioResponse.De)
            .ToList();
    }

    private async Task<Ocorrencia> CarregarAsync(Guid id, CancellationToken ct) =>
        await ocorrencias.ObterPorIdAsync(id, ct) ?? throw new RecursoNaoEncontradoException("Ocorrência", id);

    private async Task GarantirUsuarioExisteAsync(Guid usuarioId, CancellationToken ct)
    {
        if (!await usuarios.ExisteAsync(usuarioId, ct))
            throw new RecursoNaoEncontradoException("Usuário", usuarioId);
    }
}
