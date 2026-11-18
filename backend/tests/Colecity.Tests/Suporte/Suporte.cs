using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
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
        _opcoes = new DbContextOptionsBuilder<ColecityDbContext>()
            .UseSqlite(_conexao, o => o.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery))
            .Options;
        using var db = CriarContexto();
        db.Database.Migrate();
    }

    /// <summary>Cada chamada devolve um contexto novo, como em requisições diferentes.</summary>
    public ColecityDbContext CriarContexto() => new(_opcoes);

    public void Dispose() => _conexao.Dispose();
}

/// <summary>Relógio controlado pelos testes.</summary>
public sealed class RelogioFixo(DateTime agora) : TimeProvider
{
    public DateTime Agora { get; set; } = agora;

    public override DateTimeOffset GetUtcNow() => new(Agora, TimeSpan.Zero);
}

public static class Fabrica
{
    public static readonly DateTime Agora = new(2026, 11, 16, 12, 0, 0, DateTimeKind.Utc);
    public static readonly Coordenada Se = new(-23.5503, -46.6339);
    public static readonly Coordenada Mooca = new(-23.5512, -46.5998);

    public static Usuario Usuario(string apelido) =>
        Domain.Entities.Usuario.Cadastrar($"uid-{apelido}", $"Pessoa {apelido}", $"{apelido}@exemplo.com", "2026-11", Agora.AddDays(-30));

    public static Ocorrencia Ocorrencia(
        Usuario autor,
        Categoria categoria = Categoria.Agua,
        TipoOcorrencia tipo = TipoOcorrencia.FaltaAbastecimento,
        Coordenada? local = null,
        DateTime? em = null,
        string[]? fotos = null,
        LinhaReferencia? linha = null,
        DateTime? dataHoraOcorrido = null,
        Endereco? endereco = null) =>
        FabricaOcorrencias.Registrar(new NovaOcorrencia(
            categoria, tipo, "Descrição com tamanho suficiente.", local ?? Mooca,
            endereco ?? new Endereco("Rua Taquari", "Mooca"), autor, fotos ?? [], em ?? Agora, linha, dataHoraOcorrido));

    public static void Afetar(Ocorrencia ocorrencia, int quantidade, DateTime? em = null)
    {
        for (var i = 0; i < quantidade; i++)
            ocorrencia.MarcarParticipacao(Usuario($"afetado{i}-{Guid.NewGuid():N}"), TipoParticipacao.Afetado, em ?? Agora);
    }
}
