namespace Colecity.Domain.Enums;

public enum StatusOcorrencia
{
    /// <summary>Relato registrado, ainda com poucos apoios.</summary>
    Aberta = 1,

    /// <summary>Atingiu o mínimo de apoios do módulo e virou abaixo-assinado.</summary>
    AbaixoAssinado = 2,

    /// <summary>Um dos apoiadores confirmou que o problema foi resolvido.</summary>
    Resolvida = 3
}
