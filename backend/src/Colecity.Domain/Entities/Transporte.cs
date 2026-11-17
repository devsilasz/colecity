namespace Colecity.Domain.Entities;

/// <summary>Linha de ônibus importada do GTFS da SPTrans (routes.txt).</summary>
public class LinhaOnibus
{
    public const int CodigoMaximo = 20;
    public const int NomeMaximo = 120;

    private readonly List<SentidoLinha> _sentidos = [];

    /// <summary>Letreiro, ex.: 8700-10.</summary>
    public string Codigo { get; private set; } = null!;
    public string Nome { get; private set; } = null!;
    public IReadOnlyCollection<SentidoLinha> Sentidos => _sentidos.AsReadOnly();

    private LinhaOnibus() { }

    public LinhaOnibus(string codigo, string nome)
    {
        Codigo = codigo;
        Nome = nome;
    }

    public void AdicionarSentido(int sentido, string destino, string shapeId) =>
        _sentidos.Add(new SentidoLinha(Codigo, sentido, destino, shapeId));
}

/// <summary>Sentido da linha (trips.txt): 1 = ida, 2 = volta, com o shape do trajeto.</summary>
public class SentidoLinha
{
    public string LinhaCodigo { get; private set; } = null!;
    public int Sentido { get; private set; }
    public string Destino { get; private set; } = null!;
    public string ShapeId { get; private set; } = null!;

    private SentidoLinha() { }

    internal SentidoLinha(string linhaCodigo, int sentido, string destino, string shapeId)
    {
        LinhaCodigo = linhaCodigo;
        Sentido = sentido;
        Destino = destino;
        ShapeId = shapeId;
    }
}

/// <summary>Ponto do trajeto oficial (shapes.txt).</summary>
public class PontoTrajeto
{
    public string ShapeId { get; private set; } = null!;
    public int Sequencia { get; private set; }
    public double Lat { get; private set; }
    public double Lng { get; private set; }

    private PontoTrajeto() { }

    public PontoTrajeto(string shapeId, int sequencia, double lat, double lng)
    {
        ShapeId = shapeId;
        Sequencia = sequencia;
        Lat = lat;
        Lng = lng;
    }
}
