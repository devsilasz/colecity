using Colecity.Application.Abstractions;
using Colecity.Domain.Repositories;
using Colecity.Domain.Servicos;
using Microsoft.Extensions.Logging;

namespace Colecity.Application.Tarefas;

/// <summary>Encerramento automático por inatividade e de relatos de Segurança (RN-ACO-06, RN-ACO-09), a cada hora.</summary>
public class EncerramentoAutomaticoTarefa(
    IOcorrenciaRepository ocorrencias,
    IUnitOfWork unitOfWork,
    TimeProvider relogio,
    ILogger<EncerramentoAutomaticoTarefa> logger) : ITarefaAgendada
{
    public TimeSpan Intervalo => TimeSpan.FromHours(1);

    public async Task ExecutarAsync(CancellationToken ct)
    {
        var agora = relogio.GetUtcNow().UtcDateTime;
        var encerradas = 0;
        foreach (var ocorrencia in await ocorrencias.ListarCandidatasAoEncerramentoAsync(agora, ct))
            if (ocorrencia.EncerrarSeVencida(agora))
                encerradas++;

        if (encerradas == 0)
            return;
        await unitOfWork.SalvarAsync(ct);
        logger.LogInformation("{Total} ocorrência(s) concluída(s) automaticamente", encerradas);
    }
}

/// <summary>Recalcula as Zonas de atenção a cada 5 minutos (RN-ZON-01 a 03).</summary>
public class ZonasAtencaoTarefa(
    IMapaConsultas consultas,
    IZonaAtencaoRepository zonas,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : ITarefaAgendada
{
    public TimeSpan Intervalo => TimeSpan.FromMinutes(5);

    public async Task ExecutarAsync(CancellationToken ct)
    {
        var agora = relogio.GetUtcNow().UtcDateTime;
        var relatos = await consultas.RelatosParaZonasAsync(agora - CalculadoraZonasAtencao.Janela, ct);
        await zonas.SubstituirTodasAsync(CalculadoraZonasAtencao.Calcular(relatos, agora), ct);
        await unitOfWork.SalvarAsync(ct);
    }
}

/// <summary>Completa o título das ocorrências registradas quando a geocodificação estava fora do ar.</summary>
public class GeocodificacaoPendenteTarefa(
    IOcorrenciaRepository ocorrencias,
    IGeocodificador geocodificador,
    IUnitOfWork unitOfWork) : ITarefaAgendada
{
    private const int MaximoPorExecucao = 10;

    public TimeSpan Intervalo => TimeSpan.FromMinutes(5);

    public async Task ExecutarAsync(CancellationToken ct)
    {
        var alteradas = 0;
        foreach (var ocorrencia in await ocorrencias.ListarComEnderecoPendenteAsync(MaximoPorExecucao, ct))
        {
            if (await geocodificador.ObterEnderecoAsync(ocorrencia.Localizacao, ct) is not { } endereco)
                continue;
            ocorrencia.DefinirEndereco(endereco);
            alteradas++;
        }

        if (alteradas > 0)
            await unitOfWork.SalvarAsync(ct);
    }
}
