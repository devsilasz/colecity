using Colecity.Domain.Geo;

namespace Colecity.Application.Abstractions;

/// <summary>Identidade repassada pelo BFF no header <c>X-User-Id</c>, já validada (doc 10, seção 1.1).</summary>
public interface IUsuarioAtual
{
    string? Uid { get; }
}

/// <summary>Geocodificação reversa para o título "Tipo – Rua, Bairro" (RN-REG-07).</summary>
public interface IGeocodificador
{
    /// <summary>Devolve <c>null</c> quando o serviço falha; o domínio usa o título provisório.</summary>
    Task<Endereco?> ObterEnderecoAsync(Coordenada local, CancellationToken ct = default);
}

/// <summary>Respostas já entregues por chave de idempotência (doc 10, seção 1.1).</summary>
public interface IIdempotenciaStore
{
    Task<RespostaArmazenada?> ObterAsync(Guid usuarioId, string rota, string chave, DateTime desde, CancellationToken ct = default);
    Task SalvarAsync(Guid usuarioId, string rota, string chave, RespostaArmazenada resposta, DateTime agora, CancellationToken ct = default);
}

public sealed record RespostaArmazenada(int StatusCode, string Corpo);

/// <summary>Rotina executada periodicamente em segundo plano.</summary>
public interface ITarefaAgendada
{
    TimeSpan Intervalo { get; }

    /// <summary>Executa logo na inicialização, além de a cada intervalo.</summary>
    bool ExecutarAoIniciar => true;

    Task ExecutarAsync(CancellationToken ct);
}
