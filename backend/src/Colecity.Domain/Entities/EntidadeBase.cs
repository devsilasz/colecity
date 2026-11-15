using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

public abstract class EntidadeBase
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CriadoEm { get; protected set; } = DateTime.UtcNow;

    protected static string ValidarTexto(string? valor, string campo, int tamanhoMaximo)
    {
        if (string.IsNullOrWhiteSpace(valor))
            throw new DomainException($"{campo} é obrigatório.");

        var texto = valor.Trim();
        if (texto.Length > tamanhoMaximo)
            throw new DomainException($"{campo} deve ter no máximo {tamanhoMaximo} caracteres.");

        return texto;
    }
}
