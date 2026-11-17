namespace Colecity.Domain.Exceptions;

/// <summary>Violação de uma regra de negócio (HTTP 422). Subclasses indicam outros tipos de falha.</summary>
public class DomainException : Exception
{
    public DomainException(string codigo, string mensagem, string? campo = null)
        : this(codigo, mensagem, campo is null ? new Dictionary<string, string[]>() : new() { [campo] = [mensagem] }) { }

    public DomainException(string codigo, string mensagem, IReadOnlyDictionary<string, string[]> erros) : base(mensagem)
    {
        Codigo = codigo;
        Erros = erros;
    }

    public string Codigo { get; }

    /// <summary>Mensagens por campo, devolvidas em <c>errors</c> no Problem Details.</summary>
    public IReadOnlyDictionary<string, string[]> Erros { get; }
}

/// <summary>Conflito com o estado atual do recurso (HTTP 409).</summary>
public class ConflitoException(string codigo, string mensagem) : DomainException(codigo, mensagem);

/// <summary>O usuário não tem permissão para a ação (HTTP 403).</summary>
public class AcessoNegadoException(string codigo, string mensagem) : DomainException(codigo, mensagem);

/// <summary>Recurso inexistente ou oculto para quem pede (HTTP 404).</summary>
public class NaoEncontradoException(string recurso)
    : DomainException(CodigosErro.NaoEncontrado, $"{recurso} não encontrado(a).");

/// <summary>Parâmetro em formato inválido (HTTP 400).</summary>
public class RequisicaoInvalidaException(string mensagem, string? campo = null, string codigo = CodigosErro.RequisicaoInvalida)
    : DomainException(codigo, mensagem, campo);
