using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

public sealed record LinhaResponse(int CodigoSpTrans, string Letreiro, int Sentido, string Origem, string Destino);

public sealed record SentidoLinhaResponse(int Sentido, string Destino, int VeiculosEmOperacao, int VeiculosAcessiveis);

/// <summary>Cruzamento dos dados em tempo real da SPTrans com os relatos dos cidadãos.</summary>
public sealed record SituacaoLinhaResponse(
    string Letreiro,
    string HorarioReferenciaSpTrans,
    IReadOnlyList<SentidoLinhaResponse> Sentidos,
    int TotalVeiculosEmOperacao,
    int OcorrenciasAtivas,
    int PessoasAfetadas,
    TipoProblemaTransporte? ProblemaMaisRelatado,
    string? Alerta);
