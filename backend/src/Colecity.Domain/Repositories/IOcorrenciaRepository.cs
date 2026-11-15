using Colecity.Domain.Entities;

namespace Colecity.Domain.Repositories;

public interface IOcorrenciaRepository
{
    /// <summary>Carrega a ocorrência com apoios e comentários para alteração.</summary>
    Task<Ocorrencia?> ObterPorIdAsync(Guid id, CancellationToken ct = default);
    Task<(IReadOnlyList<Ocorrencia> Itens, int Total)> ListarAsync(FiltroOcorrencias filtro, CancellationToken ct = default);
    Task<IReadOnlyList<Ocorrencia>> ListarNaoResolvidasAsync(CancellationToken ct = default);
    Task<IReadOnlyList<OcorrenciaTransporte>> ListarPorLinhaAsync(string codigoLinha, CancellationToken ct = default);
    Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken ct = default);
    void Remover(Ocorrencia ocorrencia);
}
