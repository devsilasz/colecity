namespace Colecity.Domain.Geo;

/// <summary>
/// Limite do município de São Paulo (RN-REG-06). Usa um polígono simplificado do contorno municipal;
/// em produção, o polígono oficial (GeoSampa/IBGE) entra no lugar sem mudar o algoritmo.
/// </summary>
public static class MunicipioSaoPaulo
{
    // Vértices (lat, lng) no sentido horário, a partir do extremo norte (Serra da Cantareira).
    private static readonly (double Lat, double Lng)[] Limite =
    [
        (-23.356, -46.690), (-23.380, -46.600), (-23.430, -46.560), (-23.490, -46.530),
        (-23.480, -46.400), (-23.530, -46.365), (-23.610, -46.390), (-23.650, -46.460),
        (-23.640, -46.530), (-23.600, -46.560), (-23.650, -46.625), (-23.700, -46.645),
        (-23.780, -46.630), (-23.900, -46.640), (-24.010, -46.700), (-23.960, -46.800),
        (-23.830, -46.790), (-23.730, -46.830), (-23.640, -46.790), (-23.590, -46.820),
        (-23.540, -46.760), (-23.480, -46.790), (-23.430, -46.830), (-23.390, -46.780)
    ];

    /// <summary>Teste de ponto em polígono por ray casting.</summary>
    public static bool Contem(Coordenada ponto)
    {
        var dentro = false;
        for (int i = 0, j = Limite.Length - 1; i < Limite.Length; j = i++)
        {
            var (latI, lngI) = Limite[i];
            var (latJ, lngJ) = Limite[j];
            var cruzaLatitude = latI > ponto.Lat != latJ > ponto.Lat;
            if (cruzaLatitude && ponto.Lng < (lngJ - lngI) * (ponto.Lat - latI) / (latJ - latI) + lngI)
                dentro = !dentro;
        }
        return dentro;
    }
}
