using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

public class OcorrenciaEnergia : OcorrenciaInterrupcaoServico
{
    protected override string NomeServico => "energia";
    public override int PesoUrgencia => 2;

    private OcorrenciaEnergia() { }

    public OcorrenciaEnergia(string titulo, string descricao, string bairro, Guid autorId, int? duracaoEstimadaHoras)
        : base(Modulo.Energia, titulo, descricao, bairro, autorId, duracaoEstimadaHoras) { }
}
