using Colecity.Domain.Enums;

namespace Colecity.Domain.Eventos;

/// <summary>
/// Fato relevante do domínio, publicado para o BFF enviar push (doc 10, seção 5).
/// <see cref="AutorAcaoId"/> é quem causou o fato e não recebe a notificação.
/// </summary>
public interface IEventoDominio
{
    Guid OcorrenciaId { get; }
    string Titulo { get; }
    Guid? AutorAcaoId { get; }
    DateTime OcorridoEm { get; }
}

public sealed record EstadoAlteradoEvento(
    Guid OcorrenciaId, string Titulo, EstadoOcorrencia NovoEstado, MotivoConclusao? Motivo,
    Guid? AutorAcaoId, DateTime OcorridoEm) : IEventoDominio;

public sealed record ComentarioCriadoEvento(
    Guid OcorrenciaId, string Titulo, Guid? AutorAcaoId, DateTime OcorridoEm) : IEventoDominio;

public sealed record DesvioConfirmadoEvento(
    Guid OcorrenciaId, string Titulo, string Linha, Guid? AutorAcaoId, DateTime OcorridoEm) : IEventoDominio;
