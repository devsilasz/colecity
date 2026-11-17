using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Dominio;

public class GeoTests
{
    [Theory]
    [InlineData(-23.5503, -46.6339)] // Sé
    [InlineData(-23.5512, -46.5998)] // Mooca
    [InlineData(-23.5670, -46.7020)] // Pinheiros
    [InlineData(-23.5410, -46.4710)] // Itaquera
    [InlineData(-23.7700, -46.6800)] // Grajaú
    [InlineData(-23.8300, -46.7300)] // Parelheiros
    public void Pontos_da_capital_estao_no_municipio(double lat, double lng) =>
        Assert.True(MunicipioSaoPaulo.Contem(new Coordenada(lat, lng)));

    [Theory]
    [InlineData(-23.4538, -46.5333)] // Guarulhos
    [InlineData(-23.5329, -46.7920)] // Osasco
    [InlineData(-23.6639, -46.5383)] // Santo André
    [InlineData(-23.6860, -46.6200)] // Diadema
    [InlineData(-23.9608, -46.3336)] // Santos
    [InlineData(-22.9068, -43.1729)] // Rio de Janeiro
    public void Cidades_vizinhas_ficam_fora(double lat, double lng) =>
        Assert.False(MunicipioSaoPaulo.Contem(new Coordenada(lat, lng)));

    [Fact]
    public void Distancia_por_haversine()
    {
        var masp = new Coordenada(-23.5614, -46.6559);

        Assert.InRange(Fabrica.Se.DistanciaMetros(masp), 2_400, 2_700);
        Assert.Equal(0, Fabrica.Se.DistanciaMetros(Fabrica.Se), precision: 6);
    }

    [Fact]
    public void Localizacao_publica_e_arredondada_em_100_metros()
    {
        var aproximada = new Coordenada(-23.551234, -46.599876).Aproximada();

        Assert.Equal(new Coordenada(-23.551, -46.6), aproximada);
    }

    [Theory]
    [InlineData(-91, 0)]
    [InlineData(0, 181)]
    [InlineData(double.NaN, 0)]
    public void Coordenada_invalida_e_rejeitada(double lat, double lng)
    {
        var erro = Assert.Throws<DomainException>(() => new Coordenada(lat, lng));
        Assert.Equal(CodigosErro.CoordenadaInvalida, erro.Codigo);
    }

    [Fact]
    public void Distancia_ate_o_trajeto()
    {
        var trajeto = new Trajeto([new Coordenada(-23.55, -46.65), new Coordenada(-23.55, -46.60)]);

        Assert.InRange(trajeto.DistanciaMetros(new Coordenada(-23.55, -46.62)), 0, 1);
        Assert.InRange(trajeto.DistanciaMetros(new Coordenada(-23.5455, -46.62)), 480, 520);
        Assert.InRange(trajeto.DistanciaMetros(new Coordenada(-23.55, -46.5955)), 440, 480);
    }

    [Fact]
    public void Caixa_delimitadora_contem_o_raio()
    {
        var caixa = CaixaDelimitadora.AoRedor(Fabrica.Se, 1_000);

        Assert.True(caixa.Contem(new Coordenada(-23.5503 + 0.008, -46.6339)));
        Assert.False(caixa.Contem(new Coordenada(-23.5503 + 0.012, -46.6339)));
    }
}
