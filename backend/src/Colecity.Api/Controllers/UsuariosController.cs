using Colecity.Api.Infra;
using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Usuário do domínio (RN-CON). O login acontece no Firebase; aqui ficam nome público e aceite dos termos.</summary>
[ApiController]
[Route("api/v1/usuarios/me")]
[Produces("application/json")]
[Authorize(Policy = Autenticacao.PoliticaUsuario)]
public class UsuariosController(IUsuarioService usuarios) : ControllerBase
{
    /// <summary>Cria ou atualiza o usuário no primeiro acesso (chamado pelo BFF após o login).</summary>
    /// <response code="422">ACEITE_TERMOS_OBRIGATORIO, NOME_INVALIDO ou EMAIL_INVALIDO.</response>
    /// <response code="409">EMAIL_JA_CADASTRADO.</response>
    [HttpPut]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status422UnprocessableEntity)]
    public async Task<IActionResult> Salvar(CadastroUsuarioRequest request, CancellationToken ct) =>
        Ok(await usuarios.SalvarCadastroAsync(request, ct));

    /// <summary>Dados do usuário logado.</summary>
    /// <response code="403">USUARIO_NAO_CADASTRADO.</response>
    [HttpGet]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status403Forbidden)]
    public async Task<IActionResult> Obter(CancellationToken ct) => Ok(await usuarios.ObterAsync(ct));

    /// <summary>Altera nome e/ou e-mail. Outros campos são recusados com 400.</summary>
    [HttpPatch]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Atualizar(AtualizacaoUsuarioRequest request, CancellationToken ct) =>
        Ok(await usuarios.AtualizarAsync(request, ct));

    /// <summary>Exclui a conta por anonimização (RN-CON-08). Depois disso, o uid não é mais reconhecido.</summary>
    [HttpDelete]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    public async Task<IActionResult> Excluir(CancellationToken ct)
    {
        await usuarios.ExcluirContaAsync(ct);
        return NoContent();
    }

    /// <summary>Minhas ocorrências: não concluídas primeiro, depois as concluídas (RN-MIN-01, 02).</summary>
    /// <param name="aba">REGISTRADAS, AFETADO ou APOIO.</param>
    /// <param name="page">Página, a partir de 1.</param>
    /// <param name="pageSize">Itens por página (máximo 50).</param>
    /// <param name="ct">Token de cancelamento.</param>
    [HttpGet("ocorrencias")]
    [ProducesResponseType<Pagina<OcorrenciaResumoResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Minhas([FromQuery] AbaMinhas aba = AbaMinhas.Registradas, [FromQuery] int? page = null,
        [FromQuery] int? pageSize = null, CancellationToken ct = default) =>
        Ok(await usuarios.MinhasOcorrenciasAsync(aba, page, pageSize, ct));
}
