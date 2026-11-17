using Colecity.Domain.Enums;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>Registro automático da linha do tempo da ocorrência (RN-ACO-03).</summary>
public class EventoLinhaDoTempo : EntidadeBase
{
    public const int DescricaoMaxima = 200;

    public Guid OcorrenciaId { get; private set; }
    public TipoEventoLinhaDoTempo Tipo { get; private set; }
    public string Descricao { get; private set; } = null!;

    /// <summary>Trecho desviado, só em eventos de desvio de rota.</summary>
    public List<Coordenada>? Trecho { get; private set; }

    private EventoLinhaDoTempo() { }

    internal EventoLinhaDoTempo(Guid ocorrenciaId, TipoEventoLinhaDoTempo tipo, string descricao, DateTime em,
        IReadOnlyList<Coordenada>? trecho)
    {
        OcorrenciaId = ocorrenciaId;
        Tipo = tipo;
        Descricao = descricao;
        CriadoEm = em;
        Trecho = trecho?.ToList();
    }
}
