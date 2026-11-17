using Colecity.Domain.Enums;

namespace Colecity.Application.Dtos;

/// <summary>Célula do mapa de calor: peso = afetados distintos (RN-DES-01).</summary>
public sealed record PontoCalorResponse(double Lat, double Lng, int Peso);

public sealed record ZonaAtencaoResponse(Categoria Categoria, CoordenadaDto Centro, int RaioMetros, int TotalRelatos, string Texto);

public sealed record SentidoResponse(int Sentido, string Destino);

public sealed record LinhaTransporteResponse(string Codigo, string Nome, IReadOnlyList<SentidoResponse> Sentidos);

public sealed record TrajetoResponse(IReadOnlyList<CoordenadaDto> Pontos);

/// <summary>Ônibus no mapa: posição da SPTrans ou agregada de passageiros (RN-TAV-03, RN-TAV-06).</summary>
public sealed record VeiculoResponse(FontePosicao Fonte, string? Prefixo, CoordenadaDto Posicao, DateTime AtualizadoEm, bool? Acessivel);

/// <summary>Corpo de <c>POST /transporte/viagens</c>.</summary>
public sealed record IniciarViagemRequest(string? Linha, int? Sentido);

public sealed record ViagemIniciadaResponse(Guid ViagemId, DateTime ExpiraEm);

/// <summary>Corpo de <c>POST /transporte/viagens/{id}/posicoes</c>, enviado a cada minuto.</summary>
public sealed record PosicaoViagemRequest(CoordenadaDto? Posicao, DateTime? RegistradaEm);

public sealed record PosicaoRegistradaResponse(bool Ativa, bool DesvioSuspeito, IReadOnlyList<CoordenadaDto>? TrechoDesvio);

/// <summary>Corpo de <c>POST /transporte/viagens/{id}/desvio</c>.</summary>
public sealed record RespostaDesvioRequest(bool? Confirmado);

public sealed record DesvioRespondidoResponse(Guid? OcorrenciaId);
