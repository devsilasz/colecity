using System.Text.Json.Serialization;
using Colecity.Domain.Entities;

namespace Colecity.Application.Dtos;

/// <summary>Corpo de <c>PUT /usuarios/me</c>.</summary>
/// <param name="Nome">De 2 a 80 caracteres. Exemplo: Ana Souza.</param>
/// <param name="Email">Exemplo: ana@exemplo.com.</param>
/// <param name="AceiteTermosVersao">Obrigatório no primeiro acesso. Exemplo: 2026-11.</param>
public sealed record CadastroUsuarioRequest(string? Nome, string? Email, string? AceiteTermosVersao);

/// <summary>Corpo de <c>PATCH /usuarios/me</c>. Campos opcionais; outros campos são recusados.</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record AtualizacaoUsuarioRequest(string? Nome, string? Email);

public sealed record UsuarioResponse(Guid Id, string Nome, string Email, string AceiteTermosVersao, DateTime CriadoEm)
{
    public static UsuarioResponse De(Usuario u) => new(u.Id, u.Nome!, u.Email!, u.AceiteTermosVersao!, u.CriadoEm);
}
