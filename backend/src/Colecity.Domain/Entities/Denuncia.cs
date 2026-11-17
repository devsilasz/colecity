using Colecity.Domain.Enums;

namespace Colecity.Domain.Entities;

/// <summary>Denúncia de conteúdo (RN-MOD-01). Uma por conta por conteúdo.</summary>
public class Denuncia : EntidadeBase
{
    /// <summary>Com 5 contas distintas o conteúdo fica oculto até a revisão (RN-MOD-02).</summary>
    public const int ContasParaOcultar = 5;

    public TipoConteudo TipoConteudo { get; private set; }
    public Guid ConteudoId { get; private set; }
    public Guid UsuarioId { get; private set; }
    public MotivoDenuncia Motivo { get; private set; }
    public bool Revisada { get; private set; }

    private Denuncia() { }

    public Denuncia(TipoConteudo tipoConteudo, Guid conteudoId, Guid usuarioId, MotivoDenuncia motivo, DateTime agora)
    {
        TipoConteudo = tipoConteudo;
        ConteudoId = conteudoId;
        UsuarioId = usuarioId;
        Motivo = motivo;
        CriadoEm = agora;
    }

    public void MarcarRevisada() => Revisada = true;
}
