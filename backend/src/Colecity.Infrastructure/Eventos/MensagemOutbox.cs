using System.Text.Json;
using Colecity.Domain.Eventos;

namespace Colecity.Infrastructure.Eventos;

/// <summary>
/// Evento de domínio aguardando envio ao BFF (padrão Outbox): é gravado na mesma transação da
/// operação de negócio, então uma falha de envio nunca desfaz a operação (doc 10, seção 5).
/// </summary>
public class MensagemOutbox
{
    public const int MaximoTentativas = 3;

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Tipo { get; private set; } = null!;
    public string Payload { get; private set; } = null!;
    public DateTime OcorridoEm { get; private set; }
    public int Tentativas { get; private set; }
    public DateTime ProximaTentativaEm { get; private set; }
    public DateTime? ProcessadaEm { get; private set; }
    public bool Falhou { get; private set; }

    private MensagemOutbox() { }

    public static MensagemOutbox De(IEventoDominio evento) => new()
    {
        Tipo = evento switch
        {
            EstadoAlteradoEvento => "ocorrencia.estado_alterado",
            ComentarioCriadoEvento => "ocorrencia.comentario_criado",
            DesvioConfirmadoEvento => "transporte.desvio_confirmado",
            _ => throw new ArgumentOutOfRangeException(nameof(evento), evento.GetType().Name, "Evento sem tipo publicado.")
        },
        Payload = JsonSerializer.Serialize(evento, evento.GetType(), JsonColecity.Opcoes),
        OcorridoEm = evento.OcorridoEm,
        ProximaTentativaEm = evento.OcorridoEm
    };

    public void MarcarProcessada(DateTime agora) => ProcessadaEm = agora;

    /// <summary>3 tentativas com intervalo crescente (30 s, 2 min); depois disso, desiste.</summary>
    public void RegistrarFalha(DateTime agora)
    {
        Tentativas++;
        if (Tentativas >= MaximoTentativas)
            Falhou = true;
        else
            ProximaTentativaEm = agora + TimeSpan.FromSeconds(30 * Math.Pow(4, Tentativas - 1));
    }
}
