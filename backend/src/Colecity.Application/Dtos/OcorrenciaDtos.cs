using System.Text.Json.Serialization;
using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

/// <summary>Corpo de <c>POST /ocorrencias</c>.</summary>
/// <param name="Linha">Só em TRANSPORTE, deve existir no GTFS. Exemplo: 8700-10.</param>
/// <param name="DataHoraOcorrido">Só em SEGURANCA; não futura e no máximo 30 dias atrás.</param>
public sealed record RegistrarOcorrenciaRequest(
    Categoria? Categoria,
    TipoOcorrencia? Tipo,
    string? Descricao,
    CoordenadaDto? Localizacao,
    string? Linha,
    DateTime? DataHoraOcorrido,
    IReadOnlyList<FotoRefDto>? Fotos);

/// <summary>Corpo de <c>PATCH /ocorrencias/{id}</c>: só descrição e fotos (a lista substitui a atual).</summary>
[JsonUnmappedMemberHandling(JsonUnmappedMemberHandling.Disallow)]
public sealed record EditarOcorrenciaRequest(string? Descricao, IReadOnlyList<FotoRefDto>? Fotos);

/// <summary>Corpo de <c>POST /ocorrencias/{id}/conclusao</c>.</summary>
public sealed record ConcluirOcorrenciaRequest(string? Feedback, IReadOnlyList<FotoRefDto>? Fotos);

/// <summary>Corpo de <c>POST /ocorrencias/semelhantes</c>.</summary>
public sealed record SemelhantesRequest(Categoria? Categoria, TipoOcorrencia? Tipo, CoordenadaDto? Localizacao, string? Linha);

public sealed record MinhaParticipacaoResponse(bool Afetado, bool Apoio, bool Autor);

/// <summary>Item de lista (doc 10, seção 3.2).</summary>
public record OcorrenciaResumoResponse
{
    [JsonPropertyOrder(-1)]
    public required Guid Id { get; init; }
    [JsonPropertyOrder(-1)]
    public required string Titulo { get; init; }
    [JsonPropertyOrder(-1)]
    public required Categoria Categoria { get; init; }
    [JsonPropertyOrder(-1)]
    public required TipoOcorrencia Tipo { get; init; }
    [JsonPropertyOrder(-1)]
    public required EstadoOcorrencia Estado { get; init; }
    [JsonPropertyOrder(-1)]
    public required string? Bairro { get; init; }

    /// <summary>Arredondada em ~100 m. A localização exata nunca sai do domínio.</summary>
    [JsonPropertyOrder(-1)]
    public required CoordenadaDto LocalizacaoAproximada { get; init; }

    [JsonPropertyOrder(-1)]
    public required int TotalAfetados { get; init; }
    [JsonPropertyOrder(-1)]
    public required int TotalApoios { get; init; }
    [JsonPropertyOrder(-1)]
    public required DateTime UltimaAtividadeEm { get; init; }
    [JsonPropertyOrder(-1)]
    public required bool ZonaAtencao { get; init; }

    /// <summary>Só vem quando a requisição tem <c>X-User-Id</c>.</summary>
    [JsonPropertyOrder(-1)]
    public required MinhaParticipacaoResponse? MinhaParticipacao { get; init; }
}

public sealed record OcorrenciaSemelhanteResponse : OcorrenciaResumoResponse
{
    public required int DistanciaMetros { get; init; }
}

/// <summary>Detalhe (doc 10, seção 3.3).</summary>
public sealed record OcorrenciaDetalheResponse : OcorrenciaResumoResponse
{
    public required string Descricao { get; init; }
    public required string? Rua { get; init; }
    public required LinhaOcorrenciaResponse? Linha { get; init; }
    public required DateTime? DataHoraOcorrido { get; init; }
    public required IReadOnlyList<FotoResponse> Fotos { get; init; }
    public required AutorResponse Autor { get; init; }
    public required DateTime CriadaEm { get; init; }
    public required DateTime? ConcluidaEm { get; init; }
    public required ConclusaoResponse? Conclusao { get; init; }
    public required bool PodeEditar { get; init; }
    public required bool PodeConcluir { get; init; }
    public required bool PodeReabrir { get; init; }
    public required string AvisoContagem { get; init; }

    /// <summary>Só aparece (como <c>true</c>) para o autor de ocorrência oculta pela moderação.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Oculta { get; init; }
}

public sealed record LinhaOcorrenciaResponse(string Codigo, string Nome);

public sealed record AutorResponse(string Nome, bool Removido);

public sealed record ConclusaoResponse(MotivoConclusao Motivo, string? Feedback, IReadOnlyList<FotoResponse> Fotos);

public sealed record EventoLinhaDoTempoResponse(TipoEventoLinhaDoTempo Tipo, string Descricao, DateTime Em)
{
    /// <summary>Trecho desviado, só em <c>DESVIO_DETECTADO</c>.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public IReadOnlyList<CoordenadaDto>? Trecho { get; init; }
}

public sealed record ApoiadorResponse(string Nome);

/// <summary>Resposta de marcar ou retirar participação.</summary>
public sealed record ParticipacaoResponse(int TotalAfetados, int TotalApoios, MinhaParticipacaoResponse MinhaParticipacao);

public sealed record TipoResponse(TipoOcorrencia Tipo, string Nome);

public sealed record CategoriaResponse(Categoria Categoria, string Nome, IReadOnlyList<TipoResponse> Tipos);
