using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

/// <summary>Buracos e outros problemas no pavimento das ruas.</summary>
public class OcorrenciaVia : Ocorrencia
{
    public const int TamanhoPontoReferencia = 150;

    public string PontoReferencia { get; private set; } = null!;

    public override int ApoiosParaAbaixoAssinado => 3;
    public override int PesoUrgencia => 1;

    private OcorrenciaVia() { }

    public OcorrenciaVia(string titulo, string descricao, string bairro, Guid autorId, string pontoReferencia)
        : base(Modulo.Vias, titulo, descricao, bairro, autorId)
    {
        PontoReferencia = ValidarTexto(pontoReferencia, "Ponto de referência", TamanhoPontoReferencia);
    }

    public override string Resumir() => $"Via danificada: {PontoReferencia}";
}
