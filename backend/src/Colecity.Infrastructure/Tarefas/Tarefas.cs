using Colecity.Application.Abstractions;
using Colecity.Domain.Enums;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure.Tarefas;

public class TarefasOptions
{
    public const string Secao = "Tarefas";

    /// <summary>Desligado nos testes, que executam as tarefas diretamente.</summary>
    public bool Habilitadas { get; set; } = true;
}

/// <summary>Apaga dados com prazo vencido: posições de passageiros após 24 h (RN-TAV-06), chaves de idempotência e eventos já enviados.</summary>
public class LimpezaTarefa(ColecityDbContext db, TimeProvider relogio, ILogger<LimpezaTarefa> logger) : ITarefaAgendada
{
    private static readonly TimeSpan RetencaoPosicoes = TimeSpan.FromHours(24);
    private static readonly TimeSpan RetencaoIdempotencia = TimeSpan.FromHours(24);
    private static readonly TimeSpan RetencaoOutbox = TimeSpan.FromDays(7);

    public TimeSpan Intervalo => TimeSpan.FromHours(1);

    public async Task ExecutarAsync(CancellationToken ct)
    {
        var agora = relogio.GetUtcNow().UtcDateTime;

        var expiradas = await db.Viagens.Where(v => v.EncerradaEm == null && v.ExpiraEm <= agora).ToListAsync(ct);
        foreach (var viagem in expiradas)
            viagem.Encerrar(MotivoEncerramentoViagem.Expirada, agora);
        await db.SaveChangesAsync(ct);

        var limitePosicoes = agora - RetencaoPosicoes;
        var limiteIdempotencia = agora - RetencaoIdempotencia;
        var limiteOutbox = agora - RetencaoOutbox;
        var posicoes = await db.PosicoesViagem.Where(p => p.RegistradaEm < limitePosicoes).ExecuteDeleteAsync(ct);
        await db.RegistrosIdempotencia.Where(r => r.CriadoEm < limiteIdempotencia).ExecuteDeleteAsync(ct);
        await db.Outbox.Where(m => m.ProcessadaEm != null && m.ProcessadaEm < limiteOutbox).ExecuteDeleteAsync(ct);

        if (posicoes > 0)
            logger.LogInformation("{Total} posição(ões) de passageiros apagada(s) após 24 h", posicoes);
    }
}

/// <summary>Executa uma <see cref="ITarefaAgendada"/> em intervalo fixo, cada execução no seu próprio escopo de DI.</summary>
public class ExecutorTarefaPeriodica<TTarefa>(
    IServiceScopeFactory escopos,
    IOptions<TarefasOptions> opcoes,
    ILogger<ExecutorTarefaPeriodica<TTarefa>> logger) : BackgroundService
    where TTarefa : ITarefaAgendada
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        if (!opcoes.Value.Habilitadas)
            return;

        ITarefaAgendada definicao;
        await using (var escopo = escopos.CreateAsyncScope())
            definicao = escopo.ServiceProvider.GetRequiredService<TTarefa>();

        using var timer = new PeriodicTimer(definicao.Intervalo);
        if (!definicao.ExecutarAoIniciar && !await timer.WaitForNextTickAsync(stoppingToken))
            return;
        do
        {
            try
            {
                await using var escopo = escopos.CreateAsyncScope();
                await escopo.ServiceProvider.GetRequiredService<TTarefa>().ExecutarAsync(stoppingToken);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                // Uma falha não derruba a aplicação; a tarefa tenta de novo no próximo ciclo.
                logger.LogError(ex, "Falha na tarefa {Tarefa}", typeof(TTarefa).Name);
            }
        } while (await timer.WaitForNextTickAsync(stoppingToken));
    }
}
