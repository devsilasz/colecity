using Colecity.Domain.Entities;
using Colecity.Domain.Repositories;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Data;

public class ColecityDbContext(DbContextOptions<ColecityDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ocorrencia> Ocorrencias => Set<Ocorrencia>();
    public DbSet<Apoio> Apoios => Set<Apoio>();
    public DbSet<Comentario> Comentarios => Set<Comentario>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ColecityDbContext).Assembly);

    public Task SalvarAsync(CancellationToken ct = default) => SaveChangesAsync(ct);
}
