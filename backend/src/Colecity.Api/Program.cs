using Colecity.Api.Infra;
using Colecity.Application;
using Colecity.Infrastructure;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration)
    .AddAutenticacaoColecity(builder.Configuration)
    .AddLimiteRequisicoes(builder.Configuration);

builder.Services
    .AddControllers(o => o.ModelBinderProviders.Insert(0, new EnumModelBinderProvider()))
    .AddJsonOptions(o => JsonColecity.Configurar(o.JsonSerializerOptions))
    .ConfigureApiBehaviorOptions(o => o.InvalidModelStateResponseFactory = Problemas.ModeloInvalido);
builder.Services.ConfigureHttpJsonOptions(o => JsonColecity.Configurar(o.SerializerOptions));
builder.Services.AddRouting(o => o.LowercaseUrls = true);
builder.Services.AddProblemDetails(o => o.CustomizeProblemDetails = Problemas.Padronizar);
builder.Services.AddExceptionHandler<ExcecaoHandler>();
builder.Services.AddHealthChecks().AddCheck<BancoHealthCheck>("banco");
builder.Services.AddOpenApi(o =>
{
    o.AddDocumentTransformer<DocumentoOpenApi>();
    o.AddOperationTransformer<OperacaoOpenApi>();
});

var app = builder.Build();

await app.Services.InicializarBancoAsync(popular: app.Configuration.GetValue("Banco:PopularDadosDemo", true));

app.UseExceptionHandler();
app.UseStatusCodePages();

// Documentação antes da autenticação: é pública.
app.MapOpenApi().AllowAnonymous();
app.UseSwaggerUI(o =>
{
    o.SwaggerEndpoint("/openapi/v1.json", "Colecity API v1");
    o.RoutePrefix = "swagger";
    o.DocumentTitle = "Colecity API";
});
app.MapScalarApiReference(o => o.WithTitle("Colecity API")).AllowAnonymous();
app.MapGet("/", () => Results.Redirect("/swagger")).ExcludeFromDescription().AllowAnonymous();

var health = new HealthCheckOptions
{
    ResponseWriter = (contexto, relatorio) => contexto.Response.WriteAsJsonAsync(
        new { status = relatorio.Status == HealthStatus.Healthy ? "ok" : "indisponivel" })
};
app.MapHealthChecks("/health", health).AllowAnonymous();
app.MapHealthChecks("/api/v1/health", health).AllowAnonymous();

app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();

public partial class Program;
