namespace Colecity.Domain.Entities;

public abstract class EntidadeBase
{
    public Guid Id { get; protected set; } = Guid.NewGuid();
    public DateTime CriadoEm { get; protected set; }
}
