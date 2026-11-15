using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Módulo de transporte: linhas de ônibus com dados em tempo real da SPTrans.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class LinhasController(ILinhaService linhas) : ControllerBase
{
    /// <summary>Busca linhas na SPTrans por número ou nome do terminal.</summary>
    /// <param name="termo">Ex.: 6072, 8000 ou Lapa.</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<LinhaResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Buscar([FromQuery] string termo, CancellationToken ct) =>
        Ok(await linhas.BuscarAsync(termo, ct));

    /// <summary>Cruza os ônibus em operação (SPTrans) com os relatos dos cidadãos sobre a linha.</summary>
    /// <param name="letreiro">Letreiro completo da linha, ex.: 6072-10.</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("{letreiro}/situacao")]
    [ProducesResponseType<SituacaoLinhaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> ObterSituacao(string letreiro, CancellationToken ct) =>
        Ok(await linhas.ObterSituacaoAsync(letreiro, ct));
}
