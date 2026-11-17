using Colecity.Application.Dtos;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
using Colecity.Domain.Servicos;

namespace Colecity.Application.Abstractions;

/// <summary>Filtros de <c>GET /ocorrencias</c> já validados.</summary>
public sealed record FiltroOcorrencias(
    IReadOnlyCollection<Categoria> Categorias,
    IReadOnlyCollection<EstadoOcorrencia> Estados,
    Coordenada? Centro,
    int? RaioKm,
    string? Linha,
    int Page,
    int PageSize);

public sealed record CriterioSemelhantes(Categoria Categoria, TipoOcorrencia Tipo, Coordenada Localizacao, string? Linha);

/// <summary>
/// Lado de leitura (consultas projetadas com LINQ). As alterações passam pelos agregados e repositórios;
/// as telas de consulta usam estas projeções, que aplicam as regras de visibilidade e ordenação.
/// </summary>
public interface IOcorrenciaConsultas
{
    Task<Pagina<OcorrenciaResumoResponse>> ListarAsync(FiltroOcorrencias filtro, Guid? usuarioId, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse?> ObterDetalheAsync(Guid id, Guid? usuarioId, DateTime agora, CancellationToken ct = default);
    Task<IReadOnlyList<EventoLinhaDoTempoResponse>?> LinhaDoTempoAsync(Guid id, Guid? usuarioId, CancellationToken ct = default);
    Task<Pagina<ApoiadorResponse>?> ApoiadoresAsync(Guid id, Guid? usuarioId, int page, int pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<OcorrenciaSemelhanteResponse>> SemelhantesAsync(CriterioSemelhantes criterio, Guid usuarioId, DateTime agora, CancellationToken ct = default);
    Task<Pagina<OcorrenciaResumoResponse>> MinhasAsync(Guid usuarioId, AbaMinhas aba, int page, int pageSize, CancellationToken ct = default);
    Task<Pagina<ComentarioResponse>?> ComentariosAsync(Guid ocorrenciaId, Guid? usuarioId, int page, int pageSize, CancellationToken ct = default);
}

public interface IMapaConsultas
{
    Task<IReadOnlyList<PontoCalorResponse>> CalorAsync(CaixaDelimitadora area, Categoria? categoria, CancellationToken ct = default);
    Task<IReadOnlyList<ZonaAtencaoResponse>> ZonasAsync(CaixaDelimitadora area, CancellationToken ct = default);
    Task<IReadOnlyList<RelatoGeolocalizado>> RelatosParaZonasAsync(DateTime desde, CancellationToken ct = default);
}

public interface ITransporteConsultas
{
    /// <summary>Última posição recente de cada viagem ativa da linha, sem identificar o passageiro.</summary>
    Task<IReadOnlyList<PosicaoPassageiro>> PosicoesRecentesAsync(string linha, int sentido, DateTime desde, DateTime agora, CancellationToken ct = default);
}
