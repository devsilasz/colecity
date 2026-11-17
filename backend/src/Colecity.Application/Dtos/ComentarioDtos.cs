using System.Text.Json.Serialization;
using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

/// <summary>Corpo de <c>POST /ocorrencias/{id}/comentarios</c>. Texto de 1 a 500 caracteres.</summary>
public sealed record ComentarRequest(string? Texto, IReadOnlyList<FotoRefDto>? Fotos);

public sealed record AutorComentarioResponse(string Nome, bool Afetado, bool Removido);

/// <summary>Doc 10, seção 3.4.</summary>
public sealed record ComentarioResponse(
    Guid Id,
    string Texto,
    IReadOnlyList<FotoResponse> Fotos,
    AutorComentarioResponse Autor,
    DateTime CriadoEm,
    bool PodeExcluir)
{
    /// <summary>Só aparece (como <c>true</c>) para o autor de comentário oculto pela moderação.</summary>
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
    public bool? Oculto { get; init; }
}

/// <summary>Corpo de <c>POST /denuncias</c>.</summary>
public sealed record DenunciaRequest(TipoConteudo? TipoConteudo, Guid? ConteudoId, MotivoDenuncia? Motivo);

public sealed record DenunciaResponse(Guid Id, TipoConteudo TipoConteudo, Guid ConteudoId, MotivoDenuncia Motivo, DateTime CriadaEm);

/// <summary>Corpo de <c>POST /admin/denuncias/{conteudoId}/decisao</c>.</summary>
public sealed record DecisaoModeracaoRequest(AcaoModeracao? Acao);

public sealed record MotivoContagemResponse(MotivoDenuncia Motivo, int Total);

public sealed record ConteudoDenunciadoResponse(
    TipoConteudo TipoConteudo,
    Guid ConteudoId,
    int TotalContas,
    IReadOnlyList<MotivoContagemResponse> Motivos,
    bool Oculto,
    DateTime UltimaDenunciaEm);
