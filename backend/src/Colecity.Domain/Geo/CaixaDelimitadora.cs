namespace Colecity.Domain.Geo;

/// <summary>Retângulo de coordenadas, usado como pré-filtro barato no banco antes do cálculo exato de distância.</summary>
public sealed record CaixaDelimitadora(double MinLat, double MinLng, double MaxLat, double MaxLng)
{
    private const double MetrosPorGrau = 111_320;

    public static CaixaDelimitadora AoRedor(Coordenada centro, double raioMetros)
    {
        var dLat = raioMetros / MetrosPorGrau;
        var dLng = raioMetros / (MetrosPorGrau * Math.Cos(Coordenada.Radianos(centro.Lat)));
        return new(centro.Lat - dLat, centro.Lng - dLng, centro.Lat + dLat, centro.Lng + dLng);
    }

    public bool Contem(Coordenada p) => p.Lat >= MinLat && p.Lat <= MaxLat && p.Lng >= MinLng && p.Lng <= MaxLng;
}
