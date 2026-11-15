using Colecity.Domain.Entities;
using Colecity.Domain.Exceptions;

namespace Colecity.Tests.Dominio;

public class UsuarioTests
{
    [Fact]
    public void Email_e_normalizado()
    {
        var usuario = new Usuario(" Ana ", " Ana@Exemplo.COM ", "Grajaú");

        Assert.Equal("Ana", usuario.Nome);
        Assert.Equal("ana@exemplo.com", usuario.Email);
    }

    [Theory]
    [InlineData("sem-arroba")]
    [InlineData("@exemplo.com")]
    [InlineData("a@b@c.com")]
    [InlineData("ana@exemplo")]
    public void Email_invalido_e_rejeitado(string email)
    {
        Assert.Throws<DomainException>(() => new Usuario("Ana", email, "Grajaú"));
    }
}
