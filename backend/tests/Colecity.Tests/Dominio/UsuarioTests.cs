using Colecity.Domain.Entities;
using Colecity.Domain.Exceptions;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Dominio;

public class UsuarioTests
{
    [Fact]
    public void Cadastro_exige_aceite_dos_termos()
    {
        var erro = Assert.Throws<DomainException>(() => Usuario.Cadastrar("uid", "Ana Souza", "ana@exemplo.com", null, Fabrica.Agora));
        Assert.Equal(CodigosErro.AceiteTermosObrigatorio, erro.Codigo);
    }

    [Theory]
    [InlineData("A")]
    [InlineData("   ")]
    public void Nome_precisa_ter_de_2_a_80_caracteres(string nome)
    {
        var erro = Assert.Throws<DomainException>(() => Usuario.Cadastrar("uid", nome, "ana@exemplo.com", "2026-11", Fabrica.Agora));
        Assert.Equal(CodigosErro.NomeInvalido, erro.Codigo);
    }

    [Theory]
    [InlineData("sem-arroba")]
    [InlineData("a@b@c.com")]
    [InlineData("ana@exemplo")]
    public void Email_invalido_e_rejeitado(string email)
    {
        var erro = Assert.Throws<DomainException>(() => Usuario.Cadastrar("uid", "Ana", email, "2026-11", Fabrica.Agora));
        Assert.Equal(CodigosErro.EmailInvalido, erro.Codigo);
    }

    [Fact]
    public void Email_e_normalizado()
    {
        var usuario = Usuario.Cadastrar("uid", " Ana ", " Ana@Exemplo.COM ", "2026-11", Fabrica.Agora);

        Assert.Equal("Ana", usuario.Nome);
        Assert.Equal("ana@exemplo.com", usuario.Email);
    }

    [Fact]
    public void Anonimizacao_apaga_todos_os_dados_pessoais()
    {
        var usuario = Fabrica.Usuario("ana");

        usuario.Anonimizar();

        Assert.True(usuario.Removido);
        Assert.Null(usuario.Uid);
        Assert.Null(usuario.Nome);
        Assert.Null(usuario.Email);
        Assert.Equal("Usuário removido", usuario.NomePublico);
    }
}
