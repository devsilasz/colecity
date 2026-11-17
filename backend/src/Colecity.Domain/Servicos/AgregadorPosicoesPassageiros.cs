using Colecity.Domain.Geo;

namespace Colecity.Domain.Servicos;

public sealed record PosicaoPassageiro(Coordenada Posicao, DateTime RegistradaEm);

public sealed record PosicaoAgregada(Coordenada Posicao, DateTime AtualizadoEm);

/// <summary>
/// Junta posições de passageiros próximos entre si em um único "ônibus" (média das posições),
/// sem expor nenhum passageiro individualmente (RN-TAV-06).
/// </summary>
public static class AgregadorPosicoesPassageiros
{
    public const double DistanciaAgrupamentoMetros = 200;

    public static IReadOnlyList<PosicaoAgregada> Agregar(IEnumerable<PosicaoPassageiro> posicoes)
    {
        var grupos = new List<List<PosicaoPassageiro>>();
        foreach (var posicao in posicoes.OrderByDescending(p => p.RegistradaEm))
        {
            var grupo = grupos.FirstOrDefault(g => g[0].Posicao.DistanciaMetros(posicao.Posicao) <= DistanciaAgrupamentoMetros);
            if (grupo is null)
                grupos.Add([posicao]);
            else
                grupo.Add(posicao);
        }

        return grupos
            .Select(g => new PosicaoAgregada(
                new Coordenada(g.Average(p => p.Posicao.Lat), g.Average(p => p.Posicao.Lng)),
                g.Max(p => p.RegistradaEm)))
            .ToList();
    }
}
