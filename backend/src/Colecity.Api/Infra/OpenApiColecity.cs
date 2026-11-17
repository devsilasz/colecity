using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.OpenApi;
using Microsoft.OpenApi;

namespace Colecity.Api.Infra;

/// <summary>Informações gerais e esquemas de segurança (headers do BFF) da documentação OpenAPI.</summary>
public sealed class DocumentoOpenApi : IOpenApiDocumentTransformer
{
    public const string ServiceKey = "ServiceKey";
    public const string UserId = "UserId";
    public const string AdminKey = "AdminKey";

    public Task TransformAsync(OpenApiDocument document, OpenApiDocumentTransformerContext context, CancellationToken cancellationToken)
    {
        document.Info = new OpenApiInfo
        {
            Title = "Colecity — API de domínio",
            Version = "v1",
            Description = "API de domínio do Colecity (doc 10 do projeto): dona das regras de negócio de ocorrências, "
                          + "participação, comentários, moderação, mapa e transporte ao vivo. Consumida pelo BFF mobile. "
                          + "Em desenvolvimento, as credenciais de teste estão em appsettings.Development.json e no README."
        };
        document.Components ??= new OpenApiComponents();
        document.Components.SecuritySchemes ??= new Dictionary<string, IOpenApiSecurityScheme>();
        document.Components.SecuritySchemes[ServiceKey] = Cabecalho(Autenticacao.HeaderServico, "Segredo compartilhado entre BFF e domínio.");
        document.Components.SecuritySchemes[UserId] = Cabecalho(Autenticacao.HeaderUsuario, "uid do Firebase, já validado pelo BFF.");
        document.Components.SecuritySchemes[AdminKey] = Cabecalho(Autenticacao.HeaderAdmin, "Credencial da equipe de moderação.");
        return Task.CompletedTask;
    }

    private static OpenApiSecurityScheme Cabecalho(string nome, string descricao) => new()
    {
        Type = SecuritySchemeType.ApiKey,
        In = ParameterLocation.Header,
        Name = nome,
        Description = descricao
    };
}

/// <summary>Indica em cada operação os headers exigidos: 🔒 (X-User-Id) e ⟳ (Idempotency-Key).</summary>
public sealed class OperacaoOpenApi : IOpenApiOperationTransformer
{
    public Task TransformAsync(OpenApiOperation operation, OpenApiOperationTransformerContext context, CancellationToken cancellationToken)
    {
        var metadados = context.Description.ActionDescriptor.EndpointMetadata;
        var politica = metadados.OfType<AuthorizeAttribute>().Select(a => a.Policy).FirstOrDefault();
        var documento = context.Document;

        OpenApiSecurityRequirement Requisito(params string[] esquemas)
        {
            var requisito = new OpenApiSecurityRequirement();
            foreach (var esquema in esquemas)
                requisito[new OpenApiSecuritySchemeReference(esquema, documento)] = [];
            return requisito;
        }

        operation.Security = politica switch
        {
            Autenticacao.PoliticaAdmin => [Requisito(DocumentoOpenApi.AdminKey)],
            Autenticacao.PoliticaUsuario => [Requisito(DocumentoOpenApi.ServiceKey, DocumentoOpenApi.UserId)],
            // Rotas públicas: X-User-Id é opcional e só preenche "minhaParticipacao".
            _ => [Requisito(DocumentoOpenApi.ServiceKey, DocumentoOpenApi.UserId), Requisito(DocumentoOpenApi.ServiceKey)]
        };

        if (metadados.OfType<IdempotenteAttribute>().Any())
        {
            operation.Parameters ??= [];
            operation.Parameters.Add(new OpenApiParameter
            {
                Name = FiltroIdempotencia.Header,
                In = ParameterLocation.Header,
                Required = true,
                Description = "Id único gerado pelo app. Repetir a mesma chave em até 24 h devolve a mesma resposta.",
                Schema = new OpenApiSchema { Type = JsonSchemaType.String }
            });
        }
        return Task.CompletedTask;
    }
}
