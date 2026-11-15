using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;

namespace Colecity.Domain.Entities;

/// <summary>Base para falta de serviços essenciais contínuos, como energia e água.</summary>
public abstract class OcorrenciaInterrupcaoServico : Ocorrencia
{
    public int? DuracaoEstimadaHoras { get; private set; }

    protected OcorrenciaInterrupcaoServico() { }

    protected OcorrenciaInterrupcaoServico(Modulo modulo, string titulo, string descricao, string bairro,
        Guid autorId, int? duracaoEstimadaHoras)
        : base(modulo, titulo, descricao, bairro, autorId)
    {
        if (duracaoEstimadaHoras is < 0)
            throw new DomainException("Duração estimada não pode ser negativa.");

        DuracaoEstimadaHoras = duracaoEstimadaHoras;
    }

    protected abstract string NomeServico { get; }

    public override int ApoiosParaAbaixoAssinado => 5;

    public override string Resumir() => DuracaoEstimadaHoras is { } horas
        ? $"Falta de {NomeServico} em {Bairro} há {horas}h"
        : $"Falta de {NomeServico} em {Bairro}";
}
