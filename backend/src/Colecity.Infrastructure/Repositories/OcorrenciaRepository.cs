using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Repositories;

public class OcorrenciaRepository(ColecityDbContext db) : IOcorrenciaRepository
{
    public Task<Ocorrencia?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        db.Ocorrencias
            .Include(o => o.Apoios)
            .Include(o => o.Comentarios)
            .AsSplitQuery()
            .FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<(IReadOnlyList<Ocorrencia> Itens, int Total)> ListarAsync(FiltroOcorrencias filtro, CancellationToken ct = default)
    {
        var query = db.Ocorrencias.AsNoTracking().AsQueryable();

        if (filtro.Modulo is { } modulo)
            query = query.Where(o => o.Modulo == modulo);
        if (filtro.Status is { } status)
            query = query.Where(o => o.Status == status);
        if (!string.IsNullOrWhiteSpace(filtro.Bairro))
            query = query.Where(o => o.Bairro.ToLower().Contains(filtro.Bairro.Trim().ToLower()));
        if (!string.IsNullOrWhiteSpace(filtro.CodigoLinha))
        {
            var linha = filtro.CodigoLinha.Trim().ToUpperInvariant();
            query = query.Where(o => o is OcorrenciaTransporte && ((OcorrenciaTransporte)o).CodigoLinha == linha);
        }

        var total = await query.CountAsync(ct);
        var itens = await query
            .Include(o => o.Apoios)
            .OrderByDescending(o => o.Apoios.Count)
            .ThenByDescending(o => o.CriadoEm)
            .Skip((filtro.Pagina - 1) * filtro.TamanhoPagina)
            .Take(filtro.TamanhoPagina)
            .ToListAsync(ct);

        return (itens, total);
    }

    public async Task<IReadOnlyList<Ocorrencia>> ListarNaoResolvidasAsync(CancellationToken ct = default) =>
        await db.Ocorrencias.AsNoTracking()
            .Include(o => o.Apoios)
            .Where(o => o.Status != StatusOcorrencia.Resolvida)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<OcorrenciaTransporte>> ListarPorLinhaAsync(string codigoLinha, CancellationToken ct = default) =>
        await db.Ocorrencias.OfType<OcorrenciaTransporte>().AsNoTracking()
            .Include(o => o.Apoios)
            .Where(o => o.CodigoLinha == codigoLinha)
            .ToListAsync(ct);

    public async Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken ct = default) =>
        await db.Ocorrencias.AddAsync(ocorrencia, ct);

    public void Remover(Ocorrencia ocorrencia) => db.Ocorrencias.Remove(ocorrencia);
}
