using Colecity.Api.Infra;
using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Consulta (RN-CSL), registro, edição e ciclo de vida (RN-REG, RN-ACO) das ocorrências.</summary>
[ApiController]
[Route("api/v1")]
[Produces("application/json")]
public class OcorrenciasController(IOcorrenciaService ocorrencias) : ControllerBase
{
    /// <summary>Categorias e tipos de ocorrência (RN-REG-05).</summary>
    [HttpGet("categorias")]
    [ProducesResponseType<IReadOnlyList<CategoriaResponse>>(StatusCodes.Status200OK)]
    public IActionResult Categorias() => Ok(ocorrencias.ListarCategorias());

    /// <summary>Lista ocorrências, por padrão as não concluídas, ordenadas por participação e atividade.</summary>
    /// <param name="categoria">Repetível. Ex.: AGUA.</param>
    /// <param name="estado">Repetível. Padrão: ABERTA e EM_ACOMPANHAMENTO.</param>
    /// <param name="lat">Latitude do centro (junto com lng e raioKm).</param>
    /// <param name="lng">Longitude do centro.</param>
    /// <param name="raioKm">1, 5 ou 10.</param>
    /// <param name="linha">Ocorrências de uma linha de ônibus. Ex.: 8700-10.</param>
    /// <param name="page">Página, a partir de 1.</param>
    /// <param name="pageSize">Itens por página (máximo 50).</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("ocorrencias")]
    [ProducesResponseType<Pagina<OcorrenciaResumoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Listar(
        [FromQuery] Categoria[]? categoria, [FromQuery] EstadoOcorrencia[]? estado,
        [FromQuery] double? lat, [FromQuery] double? lng, [FromQuery] int? raioKm, [FromQuery] string? linha,
        [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) =>
        Ok(await ocorrencias.ListarAsync(new ConsultaOcorrencias(categoria, estado, lat, lng, raioKm, linha, page, pageSize), ct));

    /// <summary>Detalhe da ocorrência. Oculta pela moderação → 404, exceto para o autor.</summary>
    [HttpGet("ocorrencias/{id:guid}")]
    [ProducesResponseType<OcorrenciaDetalheResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obter(Guid id, CancellationToken ct) => Ok(await ocorrencias.ObterAsync(id, ct));

    /// <summary>Linha do tempo automática: criação, estados, marcos de afetados e desvios (RN-ACO-03).</summary>
    [HttpGet("ocorrencias/{id:guid}/linha-do-tempo")]
    [ProducesResponseType<IReadOnlyList<EventoLinhaDoTempoResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> LinhaDoTempo(Guid id, CancellationToken ct) => Ok(await ocorrencias.LinhaDoTempoAsync(id, ct));

    /// <summary>Nomes públicos de quem apoia (RN-PAR-06). Em Segurança, a lista é sempre vazia (RN-PAR-07).</summary>
    [HttpGet("ocorrencias/{id:guid}/apoiadores")]
    [ProducesResponseType<Pagina<ApoiadorResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Apoiadores(Guid id, [FromQuery] int? page, [FromQuery] int? pageSize, CancellationToken ct) =>
        Ok(await ocorrencias.ApoiadoresAsync(id, page, pageSize, ct));

    /// <summary>Até 5 ocorrências parecidas, sugeridas antes de criar uma nova (RN-SEM).</summary>
    /// <response code="422">LOCALIZACAO_FORA_DO_MUNICIPIO, TIPO_INVALIDO_PARA_CATEGORIA ou CAMPO_OBRIGATORIO.</response>
    [HttpPost("ocorrencias/semelhantes")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<IReadOnlyList<OcorrenciaSemelhanteResponse>>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Semelhantes(SemelhantesRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.SemelhantesAsync(request, ct));

    /// <summary>Registra uma ocorrência. Estado ABERTA, título gerado e autor contado como afetado.</summary>
    /// <response code="422">CAMPO_OBRIGATORIO, DESCRICAO_TAMANHO_INVALIDO, TIPO_INVALIDO_PARA_CATEGORIA,
    /// LOCALIZACAO_FORA_DO_MUNICIPIO, LINHA_INVALIDA, DATA_OCORRIDO_INVALIDA, FOTO_INVALIDA ou LIMITE_FOTOS_EXCEDIDO.</response>
    [HttpPost("ocorrencias")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [Idempotente]
    [ProducesResponseType<OcorrenciaDetalheResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Registrar(RegistrarOcorrenciaRequest request, CancellationToken ct)
    {
        var ocorrencia = await ocorrencias.RegistrarAsync(request, ct);
        return CreatedAtAction(nameof(Obter), new { id = ocorrencia.Id }, ocorrencia);
    }

    /// <summary>Edita descrição e fotos. Só o autor e só antes de concluir (RN-REG-09).</summary>
    /// <response code="403">SOMENTE_AUTOR.</response>
    /// <response code="409">OCORRENCIA_CONCLUIDA.</response>
    [HttpPatch("ocorrencias/{id:guid}")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<OcorrenciaDetalheResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Editar(Guid id, EditarOcorrenciaRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.EditarAsync(id, request, ct));

    /// <summary>O autor conclui, com feedback e fotos opcionais (RN-ACO-04, 05).</summary>
    /// <response code="403">SOMENTE_AUTOR.</response>
    /// <response code="409">OCORRENCIA_CONCLUIDA.</response>
    [HttpPost("ocorrencias/{id:guid}/conclusao")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<OcorrenciaDetalheResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Concluir(Guid id, ConcluirOcorrenciaRequest request, CancellationToken ct) =>
        Ok(await ocorrencias.ConcluirAsync(id, request, ct));

    /// <summary>Um afetado reabre em até 7 dias; volta para EM_ACOMPANHAMENTO (RN-ACO-07).</summary>
    /// <response code="403">SOMENTE_AFETADO.</response>
    /// <response code="422">PRAZO_REABERTURA_EXPIRADO ou REABERTURA_NAO_PERMITIDA.</response>
    [HttpPost("ocorrencias/{id:guid}/reabertura")]
    [Authorize(Policy = Autenticacao.PoliticaUsuario)]
    [ProducesResponseType<OcorrenciaDetalheResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Reabrir(Guid id, CancellationToken ct) => Ok(await ocorrencias.ReabrirAsync(id, ct));
}
