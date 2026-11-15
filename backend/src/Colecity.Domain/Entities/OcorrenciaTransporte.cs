using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

/// <summary>Relato sobre uma linha de ônibus, cruzado com os dados da SPTrans.</summary>
public class OcorrenciaTransporte : Ocorrencia
{
    public const int TamanhoCodigoLinha = 20;

    /// <summary>Letreiro da linha, no formato da SPTrans (ex.: 6072-10).</summary>
    public string CodigoLinha { get; private set; } = null!;
    public TipoProblemaTransporte TipoProblema { get; private set; }

    public override int ApoiosParaAbaixoAssinado => 10;
    public override int PesoUrgencia => 2;

    private OcorrenciaTransporte() { }

    public OcorrenciaTransporte(string titulo, string descricao, string bairro, Guid autorId,
        string codigoLinha, TipoProblemaTransporte tipoProblema)
        : base(Modulo.Transporte, titulo, descricao, bairro, autorId)
    {
        CodigoLinha = ValidarTexto(codigoLinha, "Código da linha", TamanhoCodigoLinha).ToUpperInvariant();
        TipoProblema = tipoProblema;
    }

    public override string Resumir() => $"Linha {CodigoLinha}: {TipoProblema}";
}
