using Colecity.Domain.Enums;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>Área com muitos relatos recentes de Segurança ou Riscos (RN-ZON). Recalculada periodicamente.</summary>
public class ZonaAtencao : EntidadeBase
{
    public Categoria Categoria { get; private set; }
    public Coordenada Centro { get; private set; } = null!;
    public int RaioMetros { get; private set; }
    public int TotalRelatos { get; private set; }

    /// <summary>O selo sempre mostra a origem (RN-ZON-02).</summary>
    public string Texto => $"{TotalRelatos} relatos da comunidade nos últimos 30 dias";

    private ZonaAtencao() { }

    public ZonaAtencao(Categoria categoria, Coordenada centro, int raioMetros, int totalRelatos, DateTime calculadaEm)
    {
        Categoria = categoria;
        Centro = centro with { };
        RaioMetros = raioMetros;
        TotalRelatos = totalRelatos;
        CriadoEm = calculadaEm;
    }

    public bool Cobre(Categoria categoria, Coordenada ponto) =>
        categoria == Categoria && Centro.DistanciaMetros(ponto) <= RaioMetros;
}
