using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

public class Usuario : EntidadeBase
{
    public const int TamanhoNome = 100;
    public const int TamanhoEmail = 150;
    public const int TamanhoBairro = 80;

    public string Nome { get; private set; } = null!;
    public string Email { get; private set; } = null!;
    public string Bairro { get; private set; } = null!;

    private Usuario() { }

    public Usuario(string nome, string email, string bairro)
    {
        Nome = ValidarTexto(nome, "Nome", TamanhoNome);
        Email = ValidarEmail(email);
        Bairro = ValidarTexto(bairro, "Bairro", TamanhoBairro);
    }

    private static string ValidarEmail(string email)
    {
        var valor = ValidarTexto(email, "E-mail", TamanhoEmail).ToLowerInvariant();
        var arroba = valor.IndexOf('@');
        if (arroba <= 0 || arroba != valor.LastIndexOf('@') || !valor[arroba..].Contains('.'))
            throw new DomainException("E-mail inválido.");

        return valor;
    }
}
