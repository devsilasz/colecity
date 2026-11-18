using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
using Colecity.Domain.Servicos;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Consultas;

public class MapaConsultas(ColecityDbContext db) : IMapaConsultas
{
    /// <summary>Células de ~500 m (0,005°).</summary>
    private const double CelulasPorGrau = 200;

    /// <summary>
    /// Mapa de calor: peso = afetados distintos por célula (RN-DES-01). Agregação feita no banco
    /// com GROUP BY e COUNT(DISTINCT), só com ocorrências ativas e visíveis.
    /// </summary>
    public async Task<IReadOnlyList<PontoCalorResponse>> CalorAsync(CaixaDelimitadora area, Categoria? categoria, CancellationToken ct = default)
    {
        var celulas = await (
                from p in db.Participacoes
                join o in db.Ocorrencias on p.OcorrenciaId equals o.Id
                where p.Tipo == TipoParticipacao.Afetado
                      && !o.Oculta
                      && o.Estado != EstadoOcorrencia.Concluida
                      && (categoria == null || o.Categoria == categoria)
                      && o.Localizacao.Lat >= area.MinLat && o.Localizacao.Lat <= area.MaxLat
                      && o.Localizacao.Lng >= area.MinLng && o.Localizacao.Lng <= area.MaxLng
                group p.UsuarioId by new
                {
                    Lat = Math.Round(o.Localizacao.Lat * CelulasPorGrau),
                    Lng = Math.Round(o.Localizacao.Lng * CelulasPorGrau)
                }
                into celula
                select new { celula.Key.Lat, celula.Key.Lng, Peso = celula.Distinct().Count() })
            .ToListAsync(ct);

        return celulas
            .Select(c => new PontoCalorResponse(Math.Round(c.Lat / CelulasPorGrau, 4), Math.Round(c.Lng / CelulasPorGrau, 4), c.Peso))
            .OrderByDescending(c => c.Peso)
            .ToList();
    }

    public async Task<IReadOnlyList<ZonaAtencaoResponse>> ZonasAsync(CaixaDelimitadora area, CancellationToken ct = default)
    {
        var zonas = await db.ZonasAtencao.AsNoTracking()
            .Where(z => z.Centro.Lat >= area.MinLat && z.Centro.Lat <= area.MaxLat
                        && z.Centro.Lng >= area.MinLng && z.Centro.Lng <= area.MaxLng)
            .ToListAsync(ct);
        return zonas
            .Select(z => new ZonaAtencaoResponse(z.Categoria, CoordenadaDto.De(z.Centro), z.RaioMetros, z.TotalRelatos, z.Texto))
            .ToList();
    }

    /// <summary>Relatos da janela de 30 dias; a política de cada categoria decide se conta para a zona.</summary>
    public async Task<IReadOnlyList<RelatoGeolocalizado>> RelatosParaZonasAsync(DateTime desde, CancellationToken ct = default)
    {
        var recentes = await db.Ocorrencias.AsNoTracking()
            .Where(o => !o.Oculta
                        && o.CriadoEm >= desde
                        && (o.Categoria == Categoria.Seguranca || o.Categoria == Categoria.RiscosInfraestrutura))
            .ToListAsync(ct);
        return recentes
            .Where(o => o.ContaParaZonaDeAtencao)
            .Select(o => new RelatoGeolocalizado(o.Categoria, o.Localizacao, o.AutorId))
            .ToList();
    }
}

public class TransporteConsultas(ColecityDbContext db) : ITransporteConsultas
{
    public async Task<IReadOnlyList<PosicaoPassageiro>> PosicoesRecentesAsync(string linha, int sentido, DateTime desde, DateTime agora,
        CancellationToken ct = default)
    {
        var posicoes = await (
                from p in db.PosicoesViagem
                join v in db.Viagens on p.ViagemId equals v.Id
                where v.LinhaCodigo == linha && v.Sentido == sentido
                      && v.EncerradaEm == null && v.ExpiraEm > agora
                      && p.RegistradaEm >= desde
                select new { p.ViagemId, p.Posicao.Lat, p.Posicao.Lng, p.RegistradaEm })
            .ToListAsync(ct);

        // Só a posição mais recente de cada viagem; nenhum dado do passageiro sai daqui.
        return posicoes
            .GroupBy(p => p.ViagemId)
            .Select(g => g.MaxBy(p => p.RegistradaEm)!)
            .Select(p => new PosicaoPassageiro(new Coordenada(p.Lat, p.Lng), p.RegistradaEm))
            .ToList();
    }
}
