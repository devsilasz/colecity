namespace Colecity.Application.Exceptions;

/// <summary>Serviço externo (SPTrans, geocodificação, BFF) fora do ar ou recusando a credencial (HTTP 503).</summary>
public class ServicoExternoIndisponivelException(string servico, Exception? causa = null)
    : Exception($"O serviço externo {servico} está indisponível no momento.", causa);
