using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Geo;

/// <summary>Ponto geográfico em WGS84.</summary>
public sealed record Coordenada
{
    private const double RaioTerraMetros = 6_371_000;

    private Coordenada() { }

    public Coordenada(double lat, double lng)
    {
        if (double.IsNaN(lat) || double.IsNaN(lng) || lat is < -90 or > 90 || lng is < -180 or > 180)
            throw new DomainException(CodigosErro.CoordenadaInvalida, "Coordenada inválida.", "localizacao");

        Lat = lat;
        Lng = lng;
    }

    public double Lat { get; private init; }
    public double Lng { get; private init; }

    /// <summary>Distância em linha reta (fórmula de Haversine).</summary>
    public double DistanciaMetros(Coordenada outra)
    {
        var dLat = Radianos(outra.Lat - Lat);
        var dLng = Radianos(outra.Lng - Lng);
        var a = Math.Pow(Math.Sin(dLat / 2), 2)
              + Math.Cos(Radianos(Lat)) * Math.Cos(Radianos(outra.Lat)) * Math.Pow(Math.Sin(dLng / 2), 2);
        return 2 * RaioTerraMetros * Math.Asin(Math.Sqrt(a));
    }

    /// <summary>Localização pública arredondada em ~100 m (RN-CSL-08).</summary>
    public Coordenada Aproximada() => new(Math.Round(Lat, 3), Math.Round(Lng, 3));

    internal static double Radianos(double graus) => graus * Math.PI / 180;
}
