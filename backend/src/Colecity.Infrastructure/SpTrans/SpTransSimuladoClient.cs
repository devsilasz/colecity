using Colecity.Application.Abstractions;
using Colecity.Infrastructure.Transporte;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure.SpTrans;

/// <summary>
/// Substituto da API Olho Vivo com dados simulados, usado quando nenhum token da SPTrans é configurado.
/// Mantém o mesmo contrato e posiciona os ônibus sobre o trajeto do GTFS, que se movem com o relógio.
/// </summary>
public class SpTransSimuladoClient(TimeProvider relogio, IOptions<GtfsOptions> gtfs) : ISpTransClient
{
    private static readonly TimeZoneInfo FusoSaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");
    private readonly Lazy<DadosGtfs> _dados = new(() =>
        GtfsLeitor.Ler(string.IsNullOrWhiteSpace(gtfs.Value.Diretorio) ? GtfsLeitor.DiretorioPadrao : gtfs.Value.Diretorio));

    public Task<IReadOnlyList<LinhaSpTrans>> BuscarLinhasAsync(string termo, CancellationToken ct = default)
    {
        IReadOnlyList<LinhaSpTrans> encontradas = _dados.Value.Linhas
            .Where(l => l.Codigo.Contains(termo.Trim(), StringComparison.OrdinalIgnoreCase))
            .SelectMany(l =>
            {
                var terminais = l.Nome.Split('–', StringSplitOptions.TrimEntries);
                return l.Sentidos.Select(s => new LinhaSpTrans(
                    CodigoInterno(l.Codigo, s.Sentido), l.Codigo, s.Sentido, terminais[0], terminais.ElementAtOrDefault(1) ?? terminais[0]));
            })
            .ToList();
        return Task.FromResult(encontradas);
    }

    public Task<PosicaoLinhaSpTrans> ObterPosicaoVeiculosAsync(int codigoLinha, CancellationToken ct = default)
    {
        var agora = relogio.GetUtcNow();
        var horario = TimeZoneInfo.ConvertTime(agora, FusoSaoPaulo).ToString("HH:mm");

        var sentido = _dados.Value.Linhas
            .SelectMany(l => l.Sentidos.Select(s => (Linha: l, Sentido: s)))
            .FirstOrDefault(x => CodigoInterno(x.Linha.Codigo, x.Sentido.Sentido) == codigoLinha);
        if (sentido.Sentido is null)
            return Task.FromResult(new PosicaoLinhaSpTrans(horario, []));

        var trajeto = _dados.Value.Pontos.Where(p => p.ShapeId == sentido.Sentido.ShapeId).OrderBy(p => p.Sequencia).ToList();
        var aleatorio = new Random(codigoLinha);
        var quantidade = aleatorio.Next(2, 5);
        var avanco = agora.ToUnixTimeSeconds() / 60 % 20 / 20d;

        var veiculos = Enumerable.Range(0, quantidade)
            .Select(i =>
            {
                var fracao = (i / (double)quantidade + avanco) % 1;
                var (lat, lng) = Interpolar(trajeto, fracao);
                return new VeiculoSpTrans(aleatorio.Next(10000, 99999).ToString(), aleatorio.NextDouble() > 0.2, lat, lng, agora.UtcDateTime);
            })
            .ToList();
        return Task.FromResult(new PosicaoLinhaSpTrans(horario, veiculos));
    }

    private static int CodigoInterno(string letreiro, int sentido) =>
        Math.Abs(letreiro.Aggregate(17, (hash, c) => hash * 31 + c) % 30000) + sentido * 30000;

    private static (double Lat, double Lng) Interpolar(IReadOnlyList<Domain.Entities.PontoTrajeto> trajeto, double fracao)
    {
        var posicao = fracao * (trajeto.Count - 1);
        var i = (int)Math.Floor(posicao);
        var j = Math.Min(i + 1, trajeto.Count - 1);
        var t = posicao - i;
        return (trajeto[i].Lat + (trajeto[j].Lat - trajeto[i].Lat) * t, trajeto[i].Lng + (trajeto[j].Lng - trajeto[i].Lng) * t);
    }
}
