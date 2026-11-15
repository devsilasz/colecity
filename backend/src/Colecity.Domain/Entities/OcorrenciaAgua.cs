using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

public class OcorrenciaAgua : OcorrenciaInterrupcaoServico
{
    protected override string NomeServico => "água";
    public override int PesoUrgencia => 3;

    private OcorrenciaAgua() { }

    public OcorrenciaAgua(string titulo, string descricao, string bairro, Guid autorId, int? duracaoEstimadaHoras)
        : base(Modulo.Agua, titulo, descricao, bairro, autorId, duracaoEstimadaHoras) { }
}
