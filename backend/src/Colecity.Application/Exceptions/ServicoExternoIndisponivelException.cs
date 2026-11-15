namespace Colecity.Application.Exceptions;

public class ServicoExternoIndisponivelException(string servico, Exception? causa = null)
    : Exception($"O serviço externo {servico} está indisponível no momento.", causa);
