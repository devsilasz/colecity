namespace Colecity.Domain.Enums;

/// <summary>Tipos fixos por categoria (doc 10, seção 2.1). A relação tipo → categoria fica em <c>CatalogoCategorias</c>.</summary>
public enum TipoOcorrencia
{
    AtrasoIntervaloExcessivo = 101,
    AlteracaoRotaSemAviso,
    LinhaEstacaoForaOperacao,
    Superlotacao,
    PontoEstacaoDanificado,

    FaltaAbastecimento = 201,
    BaixaPressao,
    VazamentoVia,
    AguaAparenciaAlterada,

    FaltaEnergia = 301,
    Oscilacao,
    FiacaoExpostaCaida,
    IluminacaoPublicaApagada,

    Buraco = 401,
    Alagamento,
    CalcadaDanificada,
    SemaforoSinalizacaoDefeito,

    ArvoreCaida = 501,
    GalhoRiscoQueda,
    ArvoreSobreFiacao,

    AssaltoRoubo = 601,
    Furto,
    LocalMalIluminadoErmo,

    RiscoDeslizamento = 701,
    TrechoPerigosoPedestres,
    EstruturaRiscoQueda,
    CorregoTransbordando
}
