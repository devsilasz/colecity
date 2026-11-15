using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Consultas;

/// <summary>Agregações executadas direto no banco com LINQ to Entities (GROUP BY / COUNT / SUM).</summary>
public class PainelConsultas(ColecityDbContext db) : IPainelConsultas
{
    private const int TopBairros = 5;

    public async Task<IndicadoresResponse> ObterIndicadoresAsync(CancellationToken ct = default)
    {
        var porModulo = await db.Ocorrencias
            .GroupBy(o => o.Modulo)
            .Select(g => new ModuloIndicadorResponse(
                g.Key,
                g.Count(),
                g.Count(o => o.Status == StatusOcorrencia.AbaixoAssinado),
                g.Count(o => o.Status == StatusOcorrencia.Resolvida)))
            .ToListAsync(ct);

        // Toda ocorrência tem ao menos o apoio do autor, então o INNER JOIN não descarta nenhuma.
        var bairros = await (
                from o in db.Ocorrencias
                where o.Status != StatusOcorrencia.Resolvida
                join a in db.Apoios on o.Id equals a.OcorrenciaId
                group o.Id by o.Bairro into g
                select new { Bairro = g.Key, Ocorrencias = g.Distinct().Count(), Pessoas = g.Count() })
            .OrderByDescending(b => b.Pessoas)
            .Take(TopBairros)
            .ToListAsync(ct);

        var totalApoios = await db.Apoios.CountAsync(ct);
        var relatosAtraso = await db.Ocorrencias.OfType<OcorrenciaTransporte>()
            .CountAsync(o => o.TipoProblema == TipoProblemaTransporte.Atraso
                          || o.TipoProblema == TipoProblemaTransporte.NaoPassou, ct);

        var totalOcorrencias = porModulo.Sum(m => m.Ocorrencias);
        var resolvidas = porModulo.Sum(m => m.Resolvidas);

        return new IndicadoresResponse(
            totalOcorrencias,
            totalApoios,
            MediaPessoasPorOcorrencia: totalOcorrencias == 0 ? 0 : Math.Round((double)totalApoios / totalOcorrencias, 2),
            TaxaResolucaoConfirmada: totalOcorrencias == 0 ? 0 : Math.Round(100.0 * resolvidas / totalOcorrencias, 2),
            AbaixoAssinadosAtivos: porModulo.Sum(m => m.AbaixoAssinados),
            RelatosAtrasoTransporte: relatosAtraso,
            PorModulo: porModulo.OrderBy(m => m.Modulo).ToList(),
            BairrosMaisAfetados: bairros.Select(b => new BairroIndicadorResponse(b.Bairro, b.Ocorrencias, b.Pessoas)).ToList());
    }
}
