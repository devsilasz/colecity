using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Microsoft.AspNetCore.Mvc;

namespace Colecity.Api.Controllers;

/// <summary>Cadastro dos cidadãos que relatam e apoiam ocorrências.</summary>
[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class UsuariosController(IUsuarioService usuarios) : ControllerBase
{
    /// <summary>Lista os usuários cadastrados.</summary>
    [HttpGet]
    [ProducesResponseType<IReadOnlyList<UsuarioResponse>>(StatusCodes.Status200OK)]
    public async Task<IActionResult> Listar(CancellationToken ct) => Ok(await usuarios.ListarAsync(ct));

    /// <summary>Obtém um usuário pelo identificador.</summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status404NotFound)]
    public async Task<IActionResult> Obter(Guid id, CancellationToken ct) => Ok(await usuarios.ObterAsync(id, ct));

    /// <summary>Cadastra um novo usuário.</summary>
    [HttpPost]
    [ProducesResponseType<UsuarioResponse>(StatusCodes.Status201Created)]
    [ProducesResponseType<ValidationProblemDetails>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<ProblemDetails>(StatusCodes.Status409Conflict)]
    public async Task<IActionResult> Criar(CriarUsuarioRequest request, CancellationToken ct)
    {
        var usuario = await usuarios.CriarAsync(request, ct);
        return CreatedAtAction(nameof(Obter), new { id = usuario.Id }, usuario);
    }
}
