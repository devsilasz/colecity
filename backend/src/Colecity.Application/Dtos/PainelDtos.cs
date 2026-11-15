using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

public sealed record ModuloIndicadorResponse(Modulo Modulo, int Ocorrencias, int AbaixoAssinados, int Resolvidas);

public sealed record BairroIndicadorResponse(string Bairro, int OcorrenciasAtivas, int PessoasAfetadas);

/// <summary>Indicadores de impacto definidos na Ficha da CitizenTech.</summary>
/// <param name="MediaPessoasPorOcorrencia">Quantos usuários se juntam, em média, a cada problema relatado.</param>
/// <param name="TaxaResolucaoConfirmada">Percentual de ocorrências que os próprios usuários confirmaram como resolvidas.</param>
/// <param name="RelatosAtrasoTransporte">Relatos de ônibus atrasados ou que não passaram.</param>
public sealed record IndicadoresResponse(
    int TotalOcorrencias,
    int TotalApoios,
    double MediaPessoasPorOcorrencia,
    double TaxaResolucaoConfirmada,
    int AbaixoAssinadosAtivos,
    int RelatosAtrasoTransporte,
    IReadOnlyList<ModuloIndicadorResponse> PorModulo,
    IReadOnlyList<BairroIndicadorResponse> BairrosMaisAfetados);
