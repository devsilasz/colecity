using Colecity.Application.Exceptions;
using Colecity.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Api.Middlewares;

/// <summary>Converte as exceções da aplicação em respostas ProblemDetails (RFC 9457).</summary>
public sealed class ExcecaoHandler(IProblemDetailsService problemDetails, ILogger<ExcecaoHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var (status, titulo) = exception switch
        {
            RecursoNaoEncontradoException => (StatusCodes.Status404NotFound, "Recurso não encontrado"),
            ConflitoException => (StatusCodes.Status409Conflict, "Conflito"),
            DbUpdateException => (StatusCodes.Status409Conflict, "Conflito ao salvar os dados"),
            DomainException => (StatusCodes.Status422UnprocessableEntity, "Regra de negócio violada"),
            ServicoExternoIndisponivelException => (StatusCodes.Status503ServiceUnavailable, "Serviço externo indisponível"),
            _ => (StatusCodes.Status500InternalServerError, "Erro interno")
        };

        if (status >= StatusCodes.Status500InternalServerError)
            logger.LogError(exception, "Falha ao processar {Metodo} {Caminho}", httpContext.Request.Method, httpContext.Request.Path);

        httpContext.Response.StatusCode = status;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails =
            {
                Status = status,
                Title = titulo,
                Detail = exception is DbUpdateException || status == StatusCodes.Status500InternalServerError
                    ? null
                    : exception.Message
            }
        });
    }
}
