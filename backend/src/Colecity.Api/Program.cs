using System.Text.Encodings.Web;
using System.Text.Json.Serialization;
using System.Text.Unicode;
using Colecity.Api.Middlewares;
using Colecity.Application;
using Colecity.Infrastructure;
using Microsoft.OpenApi;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services
    .AddApplication()
    .AddInfrastructure(builder.Configuration);

builder.Services
    .AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        o.JsonSerializerOptions.Encoder = JavaScriptEncoder.Create(UnicodeRanges.All);
    });
builder.Services.AddRouting(o => o.LowercaseUrls = true);
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ExcecaoHandler>();
builder.Services.AddHealthChecks();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddOpenApi(o => o.AddDocumentTransformer((documento, _, _) =>
{
    documento.Info = new OpenApiInfo
    {
        Title = "Colecity API",
        Version = "v1",
        Description = "Plataforma colaborativa que transforma reclamações urbanas isoladas em evidências coletivas. " +
                      "Módulo inicial: transporte público, cruzado com os dados em tempo real da SPTrans."
    };
    return Task.CompletedTask;
}));

var app = builder.Build();

await app.Services.InicializarBancoAsync(popular: app.Configuration.GetValue("Banco:PopularDadosDemo", true));

app.UseExceptionHandler();
app.UseCors();

app.MapOpenApi();
app.MapScalarApiReference(o => o.WithTitle("Colecity API"));
app.MapGet("/", () => Results.Redirect("/scalar")).ExcludeFromDescription();
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

public partial class Program;
