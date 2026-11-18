using Colecity.Domain.Entities;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Eventos;
using Colecity.Infrastructure.Idempotencia;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;

namespace Colecity.Infrastructure.Data;

public class ColecityDbContext(DbContextOptions<ColecityDbContext> options) : DbContext(options), IUnitOfWork
{
    public DbSet<Usuario> Usuarios => Set<Usuario>();
    public DbSet<Ocorrencia> Ocorrencias => Set<Ocorrencia>();
    public DbSet<Participacao> Participacoes => Set<Participacao>();
    public DbSet<EventoLinhaDoTempo> EventosLinhaDoTempo => Set<EventoLinhaDoTempo>();
    public DbSet<Comentario> Comentarios => Set<Comentario>();
    public DbSet<Denuncia> Denuncias => Set<Denuncia>();
    public DbSet<ZonaAtencao> ZonasAtencao => Set<ZonaAtencao>();
    public DbSet<LinhaOnibus> Linhas => Set<LinhaOnibus>();
    public DbSet<SentidoLinha> SentidosLinha => Set<SentidoLinha>();
    public DbSet<PontoTrajeto> PontosTrajeto => Set<PontoTrajeto>();
    public DbSet<Viagem> Viagens => Set<Viagem>();
    public DbSet<PosicaoViagem> PosicoesViagem => Set<PosicaoViagem>();
    public DbSet<MensagemOutbox> Outbox => Set<MensagemOutbox>();
    public DbSet<RegistroIdempotencia> RegistrosIdempotencia => Set<RegistroIdempotencia>();

    protected override void OnModelCreating(ModelBuilder modelBuilder) =>
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ColecityDbContext).Assembly);

    /// <summary>Todas as datas são UTC (doc 10, seção 1); o SQLite não guarda o Kind, então ele é restaurado na leitura.</summary>
    protected override void ConfigureConventions(ModelConfigurationBuilder configurationBuilder)
    {
        configurationBuilder.Properties<DateTime>().HaveConversion<DataUtcConverter>();
        configurationBuilder.Properties<DateTime?>().HaveConversion<DataUtcConverter>();
    }

    private sealed class DataUtcConverter() : ValueConverter<DateTime, DateTime>(
        data => data.Kind == DateTimeKind.Local ? data.ToUniversalTime() : data,
        data => DateTime.SpecifyKind(data, DateTimeKind.Utc));

    public Task SalvarAsync(CancellationToken ct = default) => SaveChangesAsync(ct);

    /// <summary>Grava os eventos de domínio pendentes no outbox, na mesma transação da alteração.</summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        var comEventos = ChangeTracker.Entries<Ocorrencia>()
            .Select(e => e.Entity)
            .Where(o => o.EventosDominio.Count > 0)
            .ToList();

        foreach (var ocorrencia in comEventos)
        {
            Outbox.AddRange(ocorrencia.EventosDominio.Select(MensagemOutbox.De));
            ocorrencia.LimparEventosDominio();
        }

        return base.SaveChangesAsync(cancellationToken);
    }
}
