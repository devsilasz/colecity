using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Servicos;

public sealed record RelatoGeolocalizado(Categoria Categoria, Coordenada Local, Guid AutorId);

/// <summary>
/// RN-ZON-01: 5 ou mais relatos de contas distintas, da mesma categoria, num raio de 300 m,
/// nos últimos 30 dias. Cada relato é testado como centro; as zonas aceitas não se sobrepõem.
/// </summary>
public static class CalculadoraZonasAtencao
{
    public const int RaioMetros = 300;
    public const int MinimoDeContas = 5;
    public static readonly TimeSpan Janela = TimeSpan.FromDays(30);

    public static IReadOnlyList<ZonaAtencao> Calcular(IEnumerable<RelatoGeolocalizado> relatosDaJanela, DateTime agora)
    {
        var zonas = new List<ZonaAtencao>();
        foreach (var categoria in relatosDaJanela.GroupBy(r => r.Categoria))
        {
            var relatos = categoria.ToList();
            var candidatas = relatos
                .Select(centro => relatos.Where(r => r.Local.DistanciaMetros(centro.Local) <= RaioMetros).ToList())
                .Where(vizinhos => vizinhos.Select(r => r.AutorId).Distinct().Count() >= MinimoDeContas)
                .OrderByDescending(vizinhos => vizinhos.Count);

            var aceitas = new List<ZonaAtencao>();
            foreach (var vizinhos in candidatas)
            {
                var centro = new Coordenada(vizinhos.Average(r => r.Local.Lat), vizinhos.Average(r => r.Local.Lng));
                if (aceitas.Any(z => z.Centro.DistanciaMetros(centro) < RaioMetros))
                    continue;
                aceitas.Add(new ZonaAtencao(categoria.Key, centro, RaioMetros, vizinhos.Count, agora));
            }
            zonas.AddRange(aceitas);
        }
        return zonas;
    }
}
