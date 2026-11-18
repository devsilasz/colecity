using Colecity.Application.Abstractions;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Data;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure.Transporte;

public class GtfsOptions
{
    public const string Secao = "Gtfs";

    /// <summary>Pasta com routes.txt, trips.txt e shapes.txt. Vazio = amostra embutida no projeto.</summary>
    public string? Diretorio { get; set; }
}

/// <summary>Importa o GTFS para as tabelas do domínio (doc 10, seção 6), em uma única transação.</summary>
public class GtfsImportador(
    ColecityDbContext db,
    ILinhaRepository linhas,
    IOptions<GtfsOptions> opcoes,
    ILogger<GtfsImportador> logger) : ITarefaAgendada
{
    /// <summary>Rotina de atualização: o GTFS da SPTrans muda poucas vezes por mês.</summary>
    public TimeSpan Intervalo => TimeSpan.FromDays(1);

    /// <summary>Na inicialização a importação já é feita por <see cref="ImportarSeVazioAsync"/>.</summary>
    public bool ExecutarAoIniciar => false;

    public Task ExecutarAsync(CancellationToken ct) => ImportarAsync(ct);

    public async Task ImportarSeVazioAsync(CancellationToken ct = default)
    {
        if (!await linhas.PossuiDadosAsync(ct))
            await ImportarAsync(ct);
    }

    public async Task ImportarAsync(CancellationToken ct = default)
    {
        var diretorio = string.IsNullOrWhiteSpace(opcoes.Value.Diretorio) ? GtfsLeitor.DiretorioPadrao : opcoes.Value.Diretorio;
        var dados = GtfsLeitor.Ler(diretorio);

        await using var transacao = await db.Database.BeginTransactionAsync(ct);
        await linhas.SubstituirTudoAsync(dados.Linhas, dados.Pontos, ct);
        await db.SaveChangesAsync(ct);
        await transacao.CommitAsync(ct);
        db.ChangeTracker.Clear();

        logger.LogInformation("GTFS importado: {Linhas} linhas e {Pontos} pontos de trajeto", dados.Linhas.Count, dados.Pontos.Count);
    }
}
