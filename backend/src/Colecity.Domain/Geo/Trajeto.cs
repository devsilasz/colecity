namespace Colecity.Domain.Geo;

/// <summary>Trajeto oficial de uma linha (GTFS shapes), usado para detectar desvio de rota (RN-TAV-07).</summary>
public sealed class Trajeto
{
    private const double MetrosPorGrau = 111_320;

    public Trajeto(IReadOnlyList<Coordenada> pontos)
    {
        if (pontos.Count < 2)
            throw new ArgumentException("O trajeto precisa de pelo menos dois pontos.", nameof(pontos));
        Pontos = pontos;
    }

    public IReadOnlyList<Coordenada> Pontos { get; }

    /// <summary>
    /// Menor distância do ponto até a polilinha. Usa projeção equirretangular local,
    /// precisa o bastante para as poucas centenas de metros que interessam aqui.
    /// </summary>
    public double DistanciaMetros(Coordenada ponto)
    {
        var cosLat = Math.Cos(Coordenada.Radianos(ponto.Lat));
        (double X, double Y) Projetar(Coordenada c) =>
            ((c.Lng - ponto.Lng) * MetrosPorGrau * cosLat, (c.Lat - ponto.Lat) * MetrosPorGrau);

        var menor = double.MaxValue;
        for (var i = 0; i < Pontos.Count - 1; i++)
            menor = Math.Min(menor, DistanciaDaOrigemAoSegmento(Projetar(Pontos[i]), Projetar(Pontos[i + 1])));
        return menor;
    }

    private static double DistanciaDaOrigemAoSegmento((double X, double Y) a, (double X, double Y) b)
    {
        var (dx, dy) = (b.X - a.X, b.Y - a.Y);
        var comprimento2 = dx * dx + dy * dy;
        var t = comprimento2 == 0 ? 0 : Math.Clamp(-(a.X * dx + a.Y * dy) / comprimento2, 0, 1);
        var (px, py) = (a.X + t * dx, a.Y + t * dy);
        return Math.Sqrt(px * px + py * py);
    }
}
