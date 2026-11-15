using Colecity.Infrastructure.Data;
using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Tests.Suporte;

/// <summary>Banco SQLite em memória com as migrations reais aplicadas.</summary>
public sealed class BancoEmMemoria : IDisposable
{
    private readonly SqliteConnection _conexao = new("DataSource=:memory:");
    private readonly DbContextOptions<ColecityDbContext> _opcoes;

    public BancoEmMemoria()
    {
        _conexao.Open();
        _opcoes = new DbContextOptionsBuilder<ColecityDbContext>().UseSqlite(_conexao).Options;
        using var db = CriarContexto();
        db.Database.Migrate();
    }

    /// <summary>Cada chamada devolve um contexto novo, simulando requisições diferentes.</summary>
    public ColecityDbContext CriarContexto() => new(_opcoes);

    public void Dispose() => _conexao.Dispose();
}
