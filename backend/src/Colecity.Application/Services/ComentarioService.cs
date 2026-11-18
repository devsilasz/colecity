using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IComentarioService
{
    Task<Pagina<ComentarioResponse>> ListarAsync(Guid ocorrenciaId, int? page, int? pageSize, CancellationToken ct = default);
    Task<ComentarioResponse> ComentarAsync(Guid ocorrenciaId, ComentarRequest request, CancellationToken ct = default);
    Task ExcluirAsync(Guid comentarioId, CancellationToken ct = default);
}

/// <summary>Fórum da ocorrência (RN-COM).</summary>
public class ComentarioService(
    ContextoUsuario contexto,
    IOcorrenciaRepository ocorrencias,
    IComentarioRepository comentarios,
    IOcorrenciaConsultas consultas,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IComentarioService
{
    public async Task<Pagina<ComentarioResponse>> ListarAsync(Guid ocorrenciaId, int? page, int? pageSize, CancellationToken ct = default)
    {
        var (pagina, tamanho) = Pagina<ComentarioResponse>.Normalizar(page, pageSize);
        var usuario = await contexto.ObterOpcionalAsync(ct);
        return await consultas.ComentariosAsync(ocorrenciaId, usuario?.Id, pagina, tamanho, ct)
               ?? throw new NaoEncontradoException("Ocorrência");
    }

    public async Task<ComentarioResponse> ComentarAsync(Guid ocorrenciaId, ComentarRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var ocorrencia = await ocorrencias.ObterAsync(ocorrenciaId, ct);
        if (ocorrencia is null || ocorrencia.Oculta)
            throw new NaoEncontradoException("Ocorrência");

        var comentario = ocorrencia.Comentar(usuario, request.Texto, request.Fotos.Paths(), relogio.GetUtcNow().UtcDateTime);
        await comentarios.AdicionarAsync(comentario, ct);
        await unitOfWork.SalvarAsync(ct);

        return new ComentarioResponse(
            comentario.Id,
            comentario.Texto,
            comentario.Fotos.Select(FotoResponse.De).ToList(),
            new AutorComentarioResponse(usuario.NomePublico, ocorrencia.Participa(usuario.Id, TipoParticipacao.Afetado), false),
            comentario.CriadoEm,
            PodeExcluir: true);
    }

    /// <summary>Só o autor exclui, e só enquanto a ocorrência não está concluída; não há edição (RN-COM-04).</summary>
    public async Task ExcluirAsync(Guid comentarioId, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var comentario = await comentarios.ObterAsync(comentarioId, ct) ?? throw new NaoEncontradoException("Comentário");
        comentario.GarantirQuePodeSerExcluidoPor(usuario.Id);
        var ocorrencia = await ocorrencias.ObterAsync(comentario.OcorrenciaId, ct);
        if (ocorrencia is { Concluida: true })
            throw new ConflitoException(CodigosErro.OcorrenciaConcluida, "A ocorrência já foi concluída.");
        comentarios.Remover(comentario);
        await unitOfWork.SalvarAsync(ct);
    }
}
