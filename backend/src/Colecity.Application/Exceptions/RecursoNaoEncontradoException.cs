namespace Colecity.Application.Exceptions;

public class RecursoNaoEncontradoException(string recurso, object chave)
    : Exception($"{recurso} '{chave}' não encontrado(a).");
