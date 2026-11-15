using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Visão agregada para cidadãos e poder público: onde a cidade precisa agir primeiro.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PainelController(IPainelService painel) : ControllerBase
{
    /// <summary>Indicadores de impacto: pessoas por ocorrência, taxa de resolução confirmada e mais.</summary>
    [HttpGet("indicadores")]
    [ProducesResponseType<IndicadoresResponse>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Indicadores(CancellationToken ct) => Ok(await painel.ObterIndicadoresAsync(ct));

    /// <summary>Ranking das ocorrências ativas por prioridade (apoios x peso de urgência do módulo).</summary>
    /// <param name="modulo">Filtra por módulo (opcional).</param>
    /// <param name="top">Quantidade de itens (1 a 50).</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("ranking")]
    [ProducesResponseType<IReadOnlyList<OcorrenciaResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Ranking([FromQuery] Modulo? modulo, [FromQuery] int top = 10, CancellationToken ct = default) =>
        Ok(await painel.ObterRankingAsync(modulo, top, ct));
}
