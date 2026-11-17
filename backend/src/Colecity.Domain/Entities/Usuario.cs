using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

/// <summary>
/// Usuário do domínio. Login e senha ficam no Firebase Auth; aqui ficam só o <c>uid</c>,
/// o nome público, o e-mail e o aceite dos termos (doc 08, seção 4).
/// </summary>
public class Usuario : EntidadeBase
{
    public const int NomeMinimo = 2;
    public const int NomeMaximo = 80;
    public const int EmailMaximo = 150;
    public const int UidMaximo = 128;
    public const int VersaoTermosMaxima = 20;
    public const string NomeUsuarioRemovido = "Usuário removido";

    public string? Uid { get; private set; }
    public string? Nome { get; private set; }
    public string? Email { get; private set; }
    public string? AceiteTermosVersao { get; private set; }
    public bool Removido { get; private set; }

    /// <summary>Único dado exibido publicamente (RN-CON-06).</summary>
    public string NomePublico => Removido ? NomeUsuarioRemovido : Nome!;

    private Usuario() { }

    /// <summary>Primeiro acesso: exige o aceite dos termos (RN-CON-01, RN-CON-11).</summary>
    public static Usuario Cadastrar(string uid, string? nome, string? email, string? aceiteTermosVersao, DateTime agora)
    {
        if (string.IsNullOrWhiteSpace(aceiteTermosVersao))
            throw new DomainException(CodigosErro.AceiteTermosObrigatorio,
                "É preciso aceitar os termos de uso e a política de privacidade.", "aceiteTermosVersao");

        var usuario = new Usuario { Uid = uid, CriadoEm = agora };
        usuario.AlterarNome(nome);
        usuario.AlterarEmail(email);
        usuario.AceitarTermos(aceiteTermosVersao);
        return usuario;
    }

    public void AlterarNome(string? nome)
    {
        var valor = nome?.Trim();
        if (valor is null || valor.Length is < NomeMinimo or > NomeMaximo)
            throw new DomainException(CodigosErro.NomeInvalido,
                $"O nome deve ter entre {NomeMinimo} e {NomeMaximo} caracteres.", "nome");
        Nome = valor;
    }

    public void AlterarEmail(string? email)
    {
        var valor = email?.Trim().ToLowerInvariant();
        var arroba = valor?.IndexOf('@') ?? -1;
        var valido = valor is { Length: <= EmailMaximo } && arroba > 0
                     && arroba == valor.LastIndexOf('@') && valor[arroba..].Contains('.');
        if (!valido)
            throw new DomainException(CodigosErro.EmailInvalido, "Informe um e-mail válido.", "email");
        Email = valor;
    }

    public void AceitarTermos(string? versao)
    {
        var valor = versao?.Trim();
        if (string.IsNullOrEmpty(valor) || valor.Length > VersaoTermosMaxima)
            throw new DomainException(CodigosErro.AceiteTermosObrigatorio, "Versão dos termos inválida.", "aceiteTermosVersao");
        AceiteTermosVersao = valor;
    }

    /// <summary>
    /// Exclusão de conta por anonimização (RN-CON-08): nada identificável permanece.
    /// Ocorrências e comentários continuam, exibidos como "Usuário removido".
    /// </summary>
    public void Anonimizar()
    {
        Uid = null;
        Nome = null;
        Email = null;
        AceiteTermosVersao = null;
        Removido = true;
    }
}
