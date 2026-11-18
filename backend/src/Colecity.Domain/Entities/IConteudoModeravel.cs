namespace Colecity.Domain.Entities;

/// <summary>Conteúdo que pode ser denunciado e ocultado pela moderação (RN-MOD).</summary>
public interface IConteudoModeravel
{
    Guid Id { get; }
    bool EstaOculto { get; }
    void Ocultar();
    void Reexibir();
}
