namespace Colecity.Infrastructure.Idempotencia;

/// <summary>Resposta entregue para uma <c>Idempotency-Key</c>, guardada por 24 horas.</summary>
public class RegistroIdempotencia
{
    public const int ChaveMaxima = 100;
    public const int RotaMaxima = 200;

    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid UsuarioId { get; private set; }
    public string Rota { get; private set; } = null!;
    public string Chave { get; private set; } = null!;
    public int StatusCode { get; private set; }
    public string Corpo { get; private set; } = null!;
    public DateTime CriadoEm { get; private set; }

    private RegistroIdempotencia() { }

    public RegistroIdempotencia(Guid usuarioId, string rota, string chave, int statusCode, string corpo, DateTime agora)
    {
        UsuarioId = usuarioId;
        Rota = rota;
        Chave = chave;
        StatusCode = statusCode;
        Corpo = corpo;
        CriadoEm = agora;
    }
}
