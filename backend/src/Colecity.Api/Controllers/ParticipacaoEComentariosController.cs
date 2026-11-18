using Colecity.Api.Infra;
using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>"Também estou sendo afetado" e "Apoiar manifestação" (RN-PAR). Operações idempotentes.</summary>
[ApiController]
[Route("api/v1/ocorrencias/{id:guid}/participacoes/{tipo:regex(^(afetado|apoio)$)}")]
[Produces("application/json")]
[Authorize(Policy = Autenticacao.PoliticaUsuario)]
public class ParticipacoesController(IParticipacaoService participacoes) : ControllerBase
{
    /// <summary>Marca a participação. Marcar de novo não duplica.</summary>
    /// <param name="id">Ocorrência.</param>
    /// <param name="tipo">afetado ou apoio.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <response code="409">OCORRENCIA_CONCLUIDA.</response>
    /// <response code="422">AUTOR_NAO_PODE_APOIAR.</response>
    [HttpPut]
    [ProducesResponseType<ParticipacaoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Marcar(Guid id, TipoParticipacao tipo, CancellationToken ct) =>
        Ok(await participacoes.MarcarAsync(id, tipo, ct));

    /// <summary>Retira a participação. Retirar o que não existe responde 204.</summary>
    /// <param name="id">Ocorrência.</param>
    /// <param name="tipo">afetado ou apoio.</param>
    /// <param name="ct">Token de cancelamento.</param>
    /// <response code="422">AUTOR_SEMPRE_AFETADO.</response>
    [HttpDelete]
    [ProducesResponseType<ParticipacaoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Retirar(Guid id, TipoParticipacao tipo, CancellationToken ct) =>
        await participacoes.RetirarAsync(id, tipo, ct) is { } resposta ? Ok(resposta) : NoContent();
}

/// <summary>Fórum da ocorrência (RN-COM).</summary>
[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class ComentariosController(IComentarioService comentarios) : ControllerBase
{
    /// <summary>Comentários em ordem cronológica, mais antigo primeiro.</summary>
    [HttpGet("ocorrencias/{id:guid}/comentarios")]
    [ProducesResponseType<Pagina<ComentarioResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Listar(Guid id, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) =>
        Ok(await comentarios.ListarAsync(id, page, pageSize, ct));

    /// <summary>Comenta em ocorrência não concluída.</summary>
    /// <response code="409">OCORRENCIA_CONCLUIDA.</response>
    /// <response code="422">COMENTARIO_TAMANHO_INVALIDO, FOTO_INVALIDA ou LIMITE_FOTOS_EXCEDIDO.</response>
    [HttpPost("ocorrencias/{id:guid}/comentarios")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [Idempotente]
    [ProducesResponseType<ComentarioResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Comentar(Guid id, ComentarRequest request, CancellationToken ct)
    {
        var comentario = await comentarios.ComentarAsync(id, request, ct);
        return CreatedAtAction(nameof(Listar), new { id }, comentario);
    }

    /// <summary>O autor exclui o próprio comentário. Não há edição.</summary>
    /// <response code="403">SOMENTE_AUTOR.</response>
    [HttpDelete("comentarios/{id:guid}")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Excluir(Guid id, CancellationToken ct)
    {
        await comentarios.ExcluirAsync(id, ct);
        return NoContent();
    }
}

/// <summary>Denúncia de ocorrências, comentários e fotos (RN-MOD).</summary>
[ApiController]
[Route("api/v1/denuncias")]
[Produces("application/json")]
[Authorize(Policy = Autenticacao.PoliticaUsuario)]
public class DenunciasController(IModeracaoService moderacao) : ControllerBase
{
    /// <summary>Uma denúncia por conta por conteúdo. Com 5 contas distintas, o conteúdo é ocultado.</summary>
    /// <response code="409">DENUNCIA_JA_REGISTRADA.</response>
    [HttpPost]
    [ProducesResponseType<DenunciaResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Denunciar(DenunciaRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await moderacao.DenunciarAsync(request, ct));
}

/// <summary>Revisão da equipe Colecity. Não exposta ao BFF: exige X-Admin-Key.</summary>
[ApiController]
[Route("api/v1/admin/denuncias")]
[Produces("application/json")]
[Authorize(Policy = Autenticacao.PoliticaAdmin)]
public class AdminDenunciasController(IModeracaoService moderacao) : ControllerBase
{
    /// <summary>Conteúdos com denúncias aguardando revisão.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<ConteudoDenunciadoResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Pendentes(CancellationToken ct) => Ok(await moderacao.ListarPendentesAsync(ct));

    /// <summary>MANTER reexibe o conteúdo; REMOVER o mantém oculto. As denúncias ficam revisadas.</summary>
    [HttpPost("{conteudoId:guid}/decisao")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Decidir(Guid conteudoId, DecisaoModeracaoRequest request, CancellationToken ct)
    {
        await moderacao.DecidirAsync(conteudoId, request, ct);
        return NoContent();
    }
}
