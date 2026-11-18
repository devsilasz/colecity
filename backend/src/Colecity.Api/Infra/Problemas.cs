using Colecity.Application.Exceptions;
using Colecity.Domain.Exceptions;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Api.Infra;

/// <summary>Problem Details (RFC 7807) com <c>code</c> estável para o app mapear mensagens (doc 10, seção 1.2).</summary>
public static class Problemas
{
    public static ProblemDetails Criar(int status, string codigo, string titulo, IReadOnlyDictionary<string, string[]>? erros = null)
    {
        var problema = new ProblemDetails { Type = "about:blank", Title = titulo, Status = status };
        problema.Extensions["code"] = codigo;
        if (erros is { Count: > 0 })
            problema.Extensions["errors"] = erros;
        return problema;
    }

    /// <summary>
    /// 400 para JSON malformado, tipo inválido ou campo não permitido, sem expor nomes internos de tipos.
    /// </summary>
    public static IActionResult ModeloInvalido(ActionContext contexto)
    {
        var erros = contexto.ModelState
            .Where(e => e.Value is { Errors.Count: > 0 } && e.Key != "request")
            .ToDictionary(
                e => e.Key.TrimStart('$', '.') is { Length: > 0 } campo ? campo : "corpo",
                e => e.Value!.Errors.Select(Mensagem).Distinct().ToArray());
        return new ObjectResult(Criar(400, CodigosErro.RequisicaoInvalida, "Requisição inválida.", erros))
        {
            StatusCode = 400,
            ContentTypes = { "application/problem+json" }
        };

        static string Mensagem(Microsoft.AspNetCore.Mvc.ModelBinding.ModelError erro) => erro.ErrorMessage switch
        {
            var m when m.Contains("could not be mapped") => "Campo não permitido.",
            var m when m.StartsWith("Valor inválido") => m,
            _ => "Valor ausente ou em formato inválido."
        };
    }

    /// <summary>Completa qualquer Problem Details gerado pelo framework (404 de rota, 405...).</summary>
    public static void Padronizar(ProblemDetailsContext contexto)
    {
        var problema = contexto.ProblemDetails;
        problema.Type = "about:blank";
        if (problema is ValidationProblemDetails)
            problema.Title = "Requisição inválida.";
        problema.Extensions.TryAdd("code", problema.Status switch
        {
            400 => CodigosErro.RequisicaoInvalida,
            401 => CodigosErro.NaoAutenticado,
            403 => CodigosErro.SemPermissao,
            404 => CodigosErro.NaoEncontrado,
            409 => CodigosErro.Conflito,
            429 => CodigosErro.MuitasRequisicoes,
            503 => CodigosErro.RecursoIndisponivel,
            _ => CodigosErro.ErroInterno
        });
    }
}

/// <summary>Converte exceções em respostas HTTP. Regras de negócio violadas viram 422; nada de stack trace para o cliente.</summary>
public sealed class ExcecaoHandler(IProblemDetailsService problemDetails, ILogger<ExcecaoHandler> logger) : IExceptionHandler
{
    public async ValueTask<bool> TryHandleAsync(HttpContext httpContext, Exception exception, CancellationToken cancellationToken)
    {
        var problema = exception switch
        {
            NaoEncontradoException e => Problemas.Criar(404, e.Codigo, e.Message),
            AcessoNegadoException e => Problemas.Criar(403, e.Codigo, e.Message),
            ConflitoException e => Problemas.Criar(409, e.Codigo, e.Message),
            RequisicaoInvalidaException e => Problemas.Criar(400, e.Codigo, e.Message, e.Erros),
            DomainException e => Problemas.Criar(422, e.Codigo, e.Message, e.Erros),
            ServicoExternoIndisponivelException e => Problemas.Criar(503, CodigosErro.RecursoIndisponivel, e.Message),
            DbUpdateException => Problemas.Criar(409, CodigosErro.Conflito, "Os dados mudaram enquanto você salvava. Tente de novo."),
            BadHttpRequestException => Problemas.Criar(400, CodigosErro.RequisicaoInvalida, "Requisição inválida."),
            _ => Problemas.Criar(500, CodigosErro.ErroInterno, "Ocorreu um erro inesperado. Tente novamente.")
        };

        if (problema.Status >= 500)
            logger.LogError(exception, "Falha ao processar {Metodo} {Caminho}", httpContext.Request.Method, httpContext.Request.Path);

        httpContext.Response.StatusCode = problema.Status!.Value;
        return await problemDetails.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problema
        });
    }
}
