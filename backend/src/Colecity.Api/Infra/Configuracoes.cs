using System.Threading.RateLimiting;
using Colecity.Domain.Exceptions;
using Colecity.Infrastructure.Data;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace Colecity.Api.Infra;

/// <summary>Limite de 30 requisições por minuto por usuário ou IP (RN-GER-12).</summary>
public static class LimiteRequisicoes
{
    public static IServiceCollection AddLimiteRequisicoes(this IServiceCollection services, IConfiguration configuration)
    {
        var limite = configuration.GetValue("RateLimit:RequisicoesPorMinuto", 30);
        services.AddRateLimiter(o =>
        {
            o.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(http =>
            {
                if (EhRotaDeInfraestrutura(http.Request.Path))
                    return RateLimitPartition.GetNoLimiter("infra");

                var uid = http.Request.Headers[Autenticacao.HeaderUsuario].ToString();
                var chave = uid.Length > 0 ? $"usuario:{uid}" : $"ip:{http.Connection.RemoteIpAddress}";
                return RateLimitPartition.GetFixedWindowLimiter(chave, _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = limite,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                });
            });
            o.OnRejected = async (contexto, ct) =>
            {
                var http = contexto.HttpContext;
                http.Response.StatusCode = StatusCodes.Status429TooManyRequests;
                http.Response.Headers.RetryAfter = "60";
                await http.RequestServices.GetRequiredService<IProblemDetailsService>().WriteAsync(new ProblemDetailsContext
                {
                    HttpContext = http,
                    ProblemDetails = Problemas.Criar(429, CodigosErro.MuitasRequisicoes, "Muitas ações seguidas, aguarde um instante.")
                });
            };
        });
        return services;
    }

    private static bool EhRotaDeInfraestrutura(PathString caminho) =>
        caminho.StartsWithSegments("/health") || caminho.StartsWithSegments("/api/v1/health")
        || caminho.StartsWithSegments("/swagger") || caminho.StartsWithSegments("/scalar") || caminho.StartsWithSegments("/openapi");
}

/// <summary>Health check que também confirma a conexão com o banco.</summary>
public sealed class BancoHealthCheck(ColecityDbContext db) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(HealthCheckContext context, CancellationToken cancellationToken = default) =>
        await db.Database.CanConnectAsync(cancellationToken)
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Banco indisponível.");
}

/// <summary>Aceita enums da query string e da rota em UPPER_SNAKE_CASE (ex.: EM_ACOMPANHAMENTO) ou minúsculas (ex.: afetado).</summary>
public sealed class EnumModelBinderProvider : IModelBinderProvider
{
    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        var tipo = Nullable.GetUnderlyingType(context.Metadata.ModelType) ?? context.Metadata.ModelType;
        return tipo.IsEnum && context.BindingInfo.BindingSource != BindingSource.Body ? new EnumModelBinder(tipo) : null;
    }

    private sealed class EnumModelBinder(Type tipo) : IModelBinder
    {
        public Task BindModelAsync(ModelBindingContext contexto)
        {
            var valor = contexto.ValueProvider.GetValue(contexto.ModelName);
            if (valor == ValueProviderResult.None)
                return Task.CompletedTask;

            contexto.ModelState.SetModelValue(contexto.ModelName, valor);
            var texto = valor.FirstValue?.Replace("_", "");
            if (!string.IsNullOrEmpty(texto) && !char.IsDigit(texto[0]) && Enum.TryParse(tipo, texto, ignoreCase: true, out var resultado))
                contexto.Result = ModelBindingResult.Success(resultado);
            else
                contexto.ModelState.TryAddModelError(contexto.ModelName, $"Valor inválido: {valor.FirstValue}.");
            return Task.CompletedTask;
        }
    }
}
