namespace Colecity.Domain.Repositories;

public interface IUnitOfWork
{
    Task SalvarAsync(CancellationToken ct = default);
}
