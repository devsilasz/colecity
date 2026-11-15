using System.ComponentModel.DataAnnotations;
using Colecity.Domain.Entities;

namespace Colecity.Application.Dtos;

public sealed record CriarUsuarioRequest
{
    /// <example>Ana Souza</example>
    [Required, StringLength(Usuario.TamanhoNome)]
    public string Nome { get; init; } = "";

    /// <example>ana@exemplo.com</example>
    [Required, EmailAddress, StringLength(Usuario.TamanhoEmail)]
    public string Email { get; init; } = "";

    /// <example>Jardim Ângela</example>
    [Required, StringLength(Usuario.TamanhoBairro)]
    public string Bairro { get; init; } = "";
}

public sealed record UsuarioResponse(Guid Id, string Nome, string Email, string Bairro, DateTime CriadoEm)
{
    public static UsuarioResponse De(Usuario u) => new(u.Id, u.Nome, u.Email, u.Bairro, u.CriadoEm);
}
