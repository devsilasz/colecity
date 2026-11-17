using Colecity.Api.Infra;
using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Mapa de calor (RN-DES-01) e Zonas de atenção (RN-ZON).</summary>
[ApiController]
[Route("api/v1/mapa")]
[Produces("application/json")]
public class MapaController(IMapaService mapa) : ControllerBase
{
    /// <summary>Intensidade por célula de ~500 m: número de afetados distintos.</summary>
    [HttpGet("calor")]
    [ProducesResponseType<IReadOnlyList<PontoCalorResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Calor([FromQuery] double? minLat, [FromQuery] double? minLng, [FromQuery] double? maxLat,
        [FromQuery] double? maxLng, [FromQuery] Categoria? categoria, CancellationToken ct) =>
        Ok(await mapa.CalorAsync(new AreaMapa(minLat, minLng, maxLat, maxLng), categoria, ct));

    /// <summary>Áreas com 5+ relatos de contas distintas em 300 m nos últimos 30 dias (Segurança e Riscos).</summary>
    [HttpGet("zonas-atencao")]
    [ProducesResponseType<IReadOnlyList<ZonaAtencaoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Zonas([FromQuery] double? minLat, [FromQuery] double? minLng, [FromQuery] double? maxLat,
        [FromQuery] double? maxLng, CancellationToken ct) =>
        Ok(await mapa.ZonasAsync(new AreaMapa(minLat, minLng, maxLat, maxLng), ct));
}

/// <summary>Transporte ao vivo (RN-TAV): linhas e trajetos do GTFS, ônibus da Olho Vivo e viagens de passageiros.</summary>
[ApiController]
[Route("api/v1/transporte")]
[Produces("application/json")]
public class TransporteController(ITransporteService transporte) : ControllerBase
{
    /// <summary>Busca linhas por número ou nome (mínimo 2 caracteres).</summary>
    [HttpGet("linhas")]
    [ProducesResponseType<IReadOnlyList<LinhaTransporteResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Linhas([FromQuery] string? busca, CancellationToken ct) =>
        Ok(await transporte.BuscarLinhasAsync(busca, ct));

    /// <summary>Trajeto oficial da linha (GTFS shapes).</summary>
    /// <param name="codigo">Ex.: 8700-10.</param>
    /// <param name="sentido">1 ou 2.</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("linhas/{codigo}/trajeto")]
    [ProducesResponseType<TrajetoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Trajeto(string codigo, [FromQuery] int? sentido, CancellationToken ct) =>
        Ok(await transporte.TrajetoAsync(codigo, sentido, ct));

    /// <summary>Ônibus da linha: SPTRANS (Olho Vivo, cache de 15 s) e PASSAGEIROS (posições agregadas).</summary>
    /// <param name="codigo">Ex.: 8700-10.</param>
    /// <param name="sentido">1 ou 2.</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("linhas/{codigo}/veiculos")]
    [ProducesResponseType<IReadOnlyList<VeiculoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Veiculos(string codigo, [FromQuery] int? sentido, CancellationToken ct) =>
        Ok(await transporte.VeiculosAsync(codigo, sentido, ct));

    /// <summary>"Estou neste ônibus": inicia a viagem (expira em 2 h; iniciar outra encerra a anterior).</summary>
    /// <response code="422">LINHA_INVALIDA ou CAMPO_OBRIGATORIO.</response>
    [HttpPost("viagens")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<ViagemIniciadaResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> IniciarViagem(IniciarViagemRequest request, CancellationToken ct) =>
        StatusCode(StatusCodes.Status201Created, await transporte.IniciarViagemAsync(request, ct));

    /// <summary>Posição enviada a cada minuto. Indica se a viagem segue ativa e se há suspeita de desvio.</summary>
    [HttpPost("viagens/{id:guid}/posicoes")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<PosicaoRegistradaResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> RegistrarPosicao(Guid id, PosicaoViagemRequest request, CancellationToken ct) =>
        Ok(await transporte.RegistrarPosicaoAsync(id, request, ct));

    /// <summary>Resposta a "O ônibus mudou de rota?". Confirmado cria ou reforça a ocorrência de desvio da linha.</summary>
    /// <response code="422">DESVIO_NAO_DETECTADO.</response>
    [HttpPost("viagens/{id:guid}/desvio")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<DesvioRespondidoResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> ResponderDesvio(Guid id, RespostaDesvioRequest request, CancellationToken ct) =>
        Ok(await transporte.ResponderDesvioAsync(id, request, ct));

    /// <summary>Encerra a viagem.</summary>
    [HttpPost("viagens/{id:guid}/encerrar")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Encerrar(Guid id, CancellationToken ct)
    {
        await transporte.EncerrarViagemAsync(id, ct);
        return NoContent();
    }
}
