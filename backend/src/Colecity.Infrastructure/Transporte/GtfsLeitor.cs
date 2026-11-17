using System.Globalization;
using Colecity.Domain.Entities;

namespace Colecity.Infrastructure.Transporte;

/// <summary>Conteúdo do GTFS já interpretado: linhas com sentidos e pontos dos trajetos usados.</summary>
public sealed record DadosGtfs(IReadOnlyList<LinhaOnibus> Linhas, IReadOnlyList<PontoTrajeto> Pontos);

/// <summary>Lê routes.txt, trips.txt e shapes.txt (CSV com cabeçalho, conforme a especificação GTFS).</summary>
public static class GtfsLeitor
{
    public static string DiretorioPadrao => Path.Combine(AppContext.BaseDirectory, "Transporte", "Gtfs");

    public static DadosGtfs Ler(string diretorio)
    {
        var linhas = LerCsv(Path.Combine(diretorio, "routes.txt"))
            .ToDictionary(r => r["route_id"], r => new LinhaOnibus(r["route_short_name"], r["route_long_name"]));

        // Um sentido por direção (direction_id 0 → sentido 1; 1 → sentido 2), com o shape da primeira viagem.
        var shapesUsados = new HashSet<string>();
        foreach (var viagem in LerCsv(Path.Combine(diretorio, "trips.txt"))
                     .GroupBy(t => (Rota: t["route_id"], Direcao: t["direction_id"]))
                     .Select(g => g.First()))
        {
            if (!linhas.TryGetValue(viagem["route_id"], out var linha))
                continue;
            linha.AdicionarSentido(int.Parse(viagem["direction_id"], CultureInfo.InvariantCulture) + 1, viagem["trip_headsign"], viagem["shape_id"]);
            shapesUsados.Add(viagem["shape_id"]);
        }

        var pontos = LerCsv(Path.Combine(diretorio, "shapes.txt"))
            .Where(s => shapesUsados.Contains(s["shape_id"]))
            .Select(s => new PontoTrajeto(
                s["shape_id"],
                int.Parse(s["shape_pt_sequence"], CultureInfo.InvariantCulture),
                double.Parse(s["shape_pt_lat"], CultureInfo.InvariantCulture),
                double.Parse(s["shape_pt_lon"], CultureInfo.InvariantCulture)))
            .ToList();

        return new DadosGtfs(linhas.Values.Where(l => l.Sentidos.Count > 0).ToList(), pontos);
    }

    private static IEnumerable<Dictionary<string, string>> LerCsv(string arquivo)
    {
        using var leitor = new StreamReader(arquivo);
        var cabecalho = DividirLinha(leitor.ReadLine() ?? "").Select(c => c.Trim().TrimStart('﻿')).ToArray();
        while (leitor.ReadLine() is { } linha)
        {
            if (string.IsNullOrWhiteSpace(linha))
                continue;
            var valores = DividirLinha(linha);
            yield return cabecalho
                .Select((coluna, i) => (coluna, valor: i < valores.Count ? valores[i] : ""))
                .ToDictionary(x => x.coluna, x => x.valor);
        }
    }

    /// <summary>Separa por vírgula respeitando campos entre aspas.</summary>
    private static List<string> DividirLinha(string linha)
    {
        var campos = new List<string>();
        var atual = new System.Text.StringBuilder();
        var entreAspas = false;
        for (var i = 0; i < linha.Length; i++)
        {
            var c = linha[i];
            if (c == '"' && entreAspas && i + 1 < linha.Length && linha[i + 1] == '"')
            {
                atual.Append('"');
                i++;
            }
            else if (c == '"')
                entreAspas = !entreAspas;
            else if (c == ',' && !entreAspas)
            {
                campos.Add(atual.ToString());
                atual.Clear();
            }
            else
                atual.Append(c);
        }
        campos.Add(atual.ToString());
        return campos;
    }
}
