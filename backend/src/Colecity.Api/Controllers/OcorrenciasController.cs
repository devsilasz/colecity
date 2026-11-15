using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Colecity.Domain.Repositories;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Relatos de problemas urbanos, abaixo-assinados e comentários.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class OcorrenciasController(IOcorrenciaService ocorrencias) : ControllerBase
{
    /// <summary>Lista ocorrências com filtros e paginação, das mais apoiadas para as menos apoiadas.</summary>
    /// <param name="modulo">Transporte, Energia, Agua ou Vias.</param>
    /// <param name="status">Aberta, AbaixoAssinado ou Resolvida.</param>
    /// <param name="bairro">Parte do nome do bairro.</param>
    /// <param name="codigoLinha">Letreiro da linha de ônibus, ex.: 6072-10.</param>
    /// <param name="pagina">Página, começando em 1.</param>
    /// <param name="tamanhoPagina">Itens por página (máximo 100).</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet]
    [ProducesResponseType<PaginaResponse<OcorrenciaResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(
        [FromQuery] Modulo? modulo, [FromQuery] StatusOcorrencia? status, [FromQuery] string? bairro,
        [FromQuery] string? codigoLinha, [FromQuery] int pagina = 1, [FromQuery] int tamanhoPagina = 20,
        CancellationToken ct = default) =>
        Ok(await ocorrencias.ListarAsync(new FiltroOcorrencias(modulo, status, bairro, codigoLinha, pagina, tamanhoPagina), ct));

    /// <summary>Obtém uma ocorrência pelo identificador.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<OcorrenciaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obter(Guid id, CancellationToken ct) => Ok(await ocorrencias.ObterAsync(id, ct));

    /// <summary>Registra uma ocorrência. O autor já entra como o primeiro apoiador.</summary>
    [HttpPost]
    [ProducesResponseType<OcorrenciaResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Criar(CriarOcorrenciaRequest request, CancellationToken ct)
    {
        var ocorrencia = await ocorrencias.CriarAsync(request, ct);
        return CreatedAtAction(nameof(Obter), new { id = ocorrencia.Id }, ocorrencia);
    }

    /// <summary>Edita título e descrição. Apenas o autor pode editar.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType<OcorrenciaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Editar(Guid id, EditarOcorrenciaRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.EditarAsync(id, request, ct));

    /// <summary>Exclui a ocorrência. Só é permitido ao autor e enquanto ninguém mais a apoiou.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Excluir(Guid id, [FromQuery] Guid usuarioId, CancellationToken ct)
    {
        await ocorrencias.ExcluirAsync(id, usuarioId, ct);
        return NoContent();
    }

    /// <summary>Assina o abaixo-assinado da ocorrência. Ao atingir o mínimo do módulo, o status muda para AbaixoAssinado.</summary>
    [HttpPost("{id:guid}/apoios")]
    [ProducesResponseType<OcorrenciaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Apoiar(Guid id, AcaoUsuarioRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.ApoiarAsync(id, request.UsuarioId, ct));

    /// <summary>Um apoiador confirma que o problema foi resolvido.</summary>
    [HttpPost("{id:guid}/resolucao")]
    [ProducesResponseType<OcorrenciaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ConfirmarResolucao(Guid id, AcaoUsuarioRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.ConfirmarResolucaoAsync(id, request.UsuarioId, ct));

    /// <summary>Lista os comentários da ocorrência em ordem cronológica.</summary>
    [HttpGet("{id:guid}/comentarios")]
    [ProducesResponseType<IReadOnlyList<ComentarioResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> ListarComentarios(Guid id, CancellationToken ct) =>
        Ok(await ocorrencias.ListarComentariosAsync(id, ct));

    /// <summary>Adiciona um comentário à ocorrência.</summary>
    [HttpPost("{id:guid}/comentarios")]
    [ProducesResponseType<ComentarioResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Comentar(Guid id, ComentarRequest request, CancellationToken ct)
    {
        var comentario = await ocorrencias.ComentarAsync(id, request, ct);
        return CreatedAtAction(nameof(ListarComentarios), new { id }, comentario);
    }
}
