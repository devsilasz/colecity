using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Nodes;
using Colecity.Application.Abstractions;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure.Eventos;

public class BffOptions
{
    public const string Secao = "Bff";

    /// <summary>URL da função <c>eventosDominio</c>. Vazio = eventos apenas registrados em log.</summary>
    public string? EventosUrl { get; set; }

    /// <summary>Credencial enviada em <c>X-Service-Key</c>. Vazio = usa <c>Seguranca:ServiceKey</c>.</summary>
    public string? ServiceKey { get; set; }
}

/// <summary>Formato enviado ao BFF (doc 10, seção 5).</summary>
public sealed record EnvelopeEvento(Guid EventId, string Tipo, DateTime OcorridoEm, JsonObject Dados);

public interface IEnvioEventosBff
{
    /// <summary>Devolve <c>true</c> quando o BFF respondeu 2xx.</summary>
    Task<bool> EnviarAsync(EnvelopeEvento envelope, CancellationToken ct);
}

public class HttpEnvioEventosBff(HttpClient http, ILogger<HttpEnvioEventosBff> logger) : IEnvioEventosBff
{
    public async Task<bool> EnviarAsync(EnvelopeEvento envelope, CancellationToken ct)
    {
        try
        {
            using var resposta = await http.PostAsJsonAsync("", envelope, JsonColecity.Opcoes, ct);
            return resposta.IsSuccessStatusCode;
        }
        catch (HttpRequestException ex)
        {
            logger.LogWarning("Falha ao enviar o evento {EventId} ao BFF: {Erro}", envelope.EventId, ex.Message);
            return false;
        }
    }
}

/// <summary>Usado quando o BFF não está configurado. Nunca registra uid nem e-mail (LGPD).</summary>
public class LogEnvioEventosBff(ILogger<LogEnvioEventosBff> logger) : IEnvioEventosBff
{
    public Task<bool> EnviarAsync(EnvelopeEvento envelope, CancellationToken ct)
    {
        var destinatarios = envelope.Dados["destinatariosUids"]?.AsArray().Count ?? 0;
        logger.LogInformation("Evento {Tipo} ({EventId}) pronto para {Total} destinatário(s); BFF não configurado",
            envelope.Tipo, envelope.EventId, destinatarios);
        return Task.FromResult(true);
    }
}

/// <summary>
/// Lê o outbox a cada 2 s, calcula os destinatários (autor, afetados e apoiadores, sem quem causou o evento)
/// e envia ao BFF. Entrega "pelo menos uma vez": o <c>eventId</c> permite ao BFF descartar repetidos.
/// </summary>
public class PublicadorEventosTarefa(
    ColecityDbContext db,
    IEnvioEventosBff envio,
    TimeProvider relogio) : ITarefaAgendada
{
    private const int LoteMaximo = 20;

    public TimeSpan Intervalo => TimeSpan.FromSeconds(2);

    public async Task ExecutarAsync(CancellationToken ct)
    {
        var agora = relogio.GetUtcNow().UtcDateTime;
        var pendentes = await db.Outbox
            .Where(m => m.ProcessadaEm == null && !m.Falhou && m.ProximaTentativaEm <= agora)
            .OrderBy(m => m.OcorridoEm)
            .Take(LoteMaximo)
            .ToListAsync(ct);

        foreach (var mensagem in pendentes)
        {
            var envelope = await MontarEnvelopeAsync(mensagem, ct);
            if (await envio.EnviarAsync(envelope, ct))
                mensagem.MarcarProcessada(agora);
            else
                mensagem.RegistrarFalha(agora);
        }

        if (pendentes.Count > 0)
            await db.SaveChangesAsync(ct);
    }

    private async Task<EnvelopeEvento> MontarEnvelopeAsync(MensagemOutbox mensagem, CancellationToken ct)
    {
        var dados = JsonNode.Parse(mensagem.Payload)!.AsObject();
        var ocorrenciaId = dados["ocorrenciaId"]!.GetValue<Guid>();
        var autorAcaoId = dados["autorAcaoId"]?.GetValue<Guid?>();
        dados.Remove("autorAcaoId");
        dados.Remove("ocorridoEm");

        var participantes =
            from p in db.Participacoes
            join u in db.Usuarios on p.UsuarioId equals u.Id
            where p.OcorrenciaId == ocorrenciaId && u.Uid != null && u.Id != autorAcaoId
            select u.Uid;
        var autor =
            from o in db.Ocorrencias
            join u in db.Usuarios on o.AutorId equals u.Id
            where o.Id == ocorrenciaId && u.Uid != null && u.Id != autorAcaoId
            select u.Uid;
        var destinatarios = await participantes.Union(autor).Distinct().ToListAsync(ct);

        var autorAcaoUid = autorAcaoId is null
            ? null
            : await db.Usuarios.Where(u => u.Id == autorAcaoId).Select(u => u.Uid).FirstOrDefaultAsync(ct);

        dados["autorAcaoUid"] = autorAcaoUid;
        dados["destinatariosUids"] = JsonSerializer.SerializeToNode(destinatarios);
        return new EnvelopeEvento(mensagem.Id, mensagem.Tipo, mensagem.OcorridoEm, dados);
    }
}
