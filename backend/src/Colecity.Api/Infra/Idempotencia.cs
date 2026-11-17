using System.Text.Json;
using Colecity.Application.Abstractions;
using Colecity.Application.Services;
using Colecity.Domain.Exceptions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Microsoft.Extensions.Options;

namespace Colecity.Api.Infra;

/// <summary>
/// Marca criações que exigem <c>Idempotency-Key</c> (⟳ no doc 10): repetir a mesma chave em até 24 h
/// devolve a mesma resposta, sem criar de novo. Protege a fila offline do app contra duplicidade.
/// </summary>
[AttributeUsage(AttributeTargets.Method)]
public sealed class IdempotenteAttribute() : TypeFilterAttribute(typeof(FiltroIdempotencia));

public sealed class FiltroIdempotencia(
    ContextoUsuario contexto,
    IIdempotenciaStore store,
    TimeProvider relogio,
    IOptions<JsonOptions> json) : IAsyncActionFilter
{
    public const string Header = "Idempotency-Key";
    private const int ChaveMaxima = 100;
    private static readonly TimeSpan Validade = TimeSpan.FromHours(24);

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        var chave = context.HttpContext.Request.Headers[Header].ToString().Trim();
        if (chave.Length is 0 or > ChaveMaxima)
            throw new RequisicaoInvalidaException($"Envie o header {Header} (até {ChaveMaxima} caracteres).",
                codigo: CodigosErro.IdempotencyKeyObrigatoria);

        var usuario = await contexto.ObterObrigatorioAsync(context.HttpContext.RequestAborted);
        var requisicao = context.HttpContext.Request;
        var rota = $"{requisicao.Method} {requisicao.Path}";
        var agora = relogio.GetUtcNow().UtcDateTime;

        if (await store.ObterAsync(usuario.Id, rota, chave, agora - Validade) is { } anterior)
        {
            context.HttpContext.Response.Headers["Idempotent-Replayed"] = "true";
            context.Result = new ContentResult
            {
                StatusCode = anterior.StatusCode,
                Content = anterior.Corpo,
                ContentType = "application/json; charset=utf-8"
            };
            return;
        }

        var executado = await next();
        if (executado.Exception is null && executado.Result is ObjectResult { Value: { } valor } resultado
                                        && (resultado.StatusCode ?? 200) is >= 200 and < 300)
        {
            var corpo = JsonSerializer.Serialize(valor, valor.GetType(), json.Value.JsonSerializerOptions);
            await store.SalvarAsync(usuario.Id, rota, chave, new RespostaArmazenada(resultado.StatusCode ?? 200, corpo), agora);
        }
    }
}
