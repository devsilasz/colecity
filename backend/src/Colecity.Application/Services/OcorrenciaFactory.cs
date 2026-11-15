using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;

namespace Colecity.Application.Services;

/// <summary>Cria a especialização correta de <see cref="Ocorrencia"/> a partir do módulo informado.</summary>
public static class OcorrenciaFactory
{
    public static Ocorrencia Criar(CriarOcorrenciaRequest r) => r.Modulo switch
    {
        Modulo.Transporte => new OcorrenciaTransporte(r.Titulo, r.Descricao, r.Bairro, r.AutorId,
            r.CodigoLinha ?? throw new DomainException("Código da linha é obrigatório para o módulo Transporte."),
            r.TipoProblema ?? throw new DomainException("Tipo do problema é obrigatório para o módulo Transporte.")),
        Modulo.Energia => new OcorrenciaEnergia(r.Titulo, r.Descricao, r.Bairro, r.AutorId, r.DuracaoEstimadaHoras),
        Modulo.Agua => new OcorrenciaAgua(r.Titulo, r.Descricao, r.Bairro, r.AutorId, r.DuracaoEstimadaHoras),
        Modulo.Vias => new OcorrenciaVia(r.Titulo, r.Descricao, r.Bairro, r.AutorId,
            r.PontoReferencia ?? throw new DomainException("Ponto de referência é obrigatório para o módulo Vias.")),
        _ => throw new DomainException("Módulo inválido.")
    };
}
