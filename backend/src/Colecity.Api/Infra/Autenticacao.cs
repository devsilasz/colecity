using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Text.Encodings.Web;
using Colecity.Application.Abstractions;
using Colecity.Domain.Exceptions;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;

namespace Colecity.Api.Infra;

/// <summary>
/// Autenticação serviço a serviço (doc 10, seção 1.1): o BFF envia <c>X-Service-Key</c> e, quando há usuário logado,
/// <c>X-User-Id</c> com o uid do Firebase já validado. O domínio só confia no uid se a chave for válida.
/// </summary>
public static class Autenticacao
{
    public const string EsquemaServico = "Servico";
    public const string EsquemaUsuario = "Usuario";
    public const string EsquemaAdmin = "Admin";
    public const string PoliticaUsuario = "Usuario";
    public const string PoliticaAdmin = "Admin";
    public const string ClaimUid = "uid";
    public const string HeaderServico = "X-Service-Key";
    public const string HeaderUsuario = "X-User-Id";
    public const string HeaderAdmin = "X-Admin-Key";

    public static IServiceCollection AddAutenticacaoColecity(this IServiceCollection services, IConfiguration configuration)
    {
        var chaveServico = configuration["Seguranca:ServiceKey"];
        if (string.IsNullOrWhiteSpace(chaveServico))
            throw new InvalidOperationException(
                "Configure a credencial de serviço em Seguranca:ServiceKey (variável de ambiente Seguranca__ServiceKey).");
        var chaveAdmin = configuration["Seguranca:AdminKey"];

        services.AddAuthentication(EsquemaServico)
            .AddScheme<ChaveOptions, ChaveHandler>(EsquemaServico, o => (o.Header, o.Chave) = (HeaderServico, chaveServico))
            .AddScheme<ChaveOptions, ChaveHandler>(EsquemaUsuario, o => (o.Header, o.Chave, o.ExigeUsuario) = (HeaderServico, chaveServico, true))
            .AddScheme<ChaveOptions, ChaveHandler>(EsquemaAdmin, o => (o.Header, o.Chave) = (HeaderAdmin, chaveAdmin));

        services.AddAuthorizationBuilder()
            // Toda rota sem política explícita exige a credencial do BFF.
            .SetFallbackPolicy(new AuthorizationPolicyBuilder(EsquemaServico).RequireAuthenticatedUser().Build())
            .AddPolicy(PoliticaUsuario, p => p.AddAuthenticationSchemes(EsquemaUsuario).RequireAuthenticatedUser().RequireClaim(ClaimUid))
            .AddPolicy(PoliticaAdmin, p => p.AddAuthenticationSchemes(EsquemaAdmin).RequireAuthenticatedUser());

        services.AddHttpContextAccessor();
        services.AddScoped<IUsuarioAtual, UsuarioAtualHttp>();
        return services;
    }
}

public class ChaveOptions : AuthenticationSchemeOptions
{
    public string Header { get; set; } = Autenticacao.HeaderServico;
    public string? Chave { get; set; }
    public bool ExigeUsuario { get; set; }
}

public class ChaveHandler(
    IOptionsMonitor<ChaveOptions> options,
    ILoggerFactory logger,
    UrlEncoder encoder,
    IProblemDetailsService problemas) : AuthenticationHandler<ChaveOptions>(options, logger, encoder)
{
    private const int UidMaximo = 128;

    protected override Task<AuthenticateResult> HandleAuthenticateAsync()
    {
        var recebida = Request.Headers[Options.Header].ToString();
        if (string.IsNullOrEmpty(recebida) || string.IsNullOrEmpty(Options.Chave))
            return Task.FromResult(AuthenticateResult.Fail($"Envie a credencial no header {Options.Header}."));
        if (!Iguais(recebida, Options.Chave))
            return Task.FromResult(AuthenticateResult.Fail("Credencial inválida."));

        var uid = Request.Headers[Autenticacao.HeaderUsuario].ToString().Trim();
        if (uid.Length > UidMaximo)
            return Task.FromResult(AuthenticateResult.Fail("X-User-Id inválido."));
        if (Options.ExigeUsuario && uid.Length == 0)
            return Task.FromResult(AuthenticateResult.Fail("Esta ação exige usuário logado (X-User-Id)."));

        var claims = new List<Claim> { new(ClaimTypes.Name, Scheme.Name) };
        if (uid.Length > 0 && Scheme.Name != Autenticacao.EsquemaAdmin)
            claims.Add(new Claim(Autenticacao.ClaimUid, uid));
        var identidade = new ClaimsIdentity(claims, Scheme.Name);
        return Task.FromResult(AuthenticateResult.Success(new AuthenticationTicket(new ClaimsPrincipal(identidade), Scheme.Name)));
    }

    protected override async Task HandleChallengeAsync(AuthenticationProperties properties)
    {
        var resultado = await HandleAuthenticateOnceSafeAsync();
        Response.StatusCode = StatusCodes.Status401Unauthorized;
        await problemas.WriteAsync(new ProblemDetailsContext
        {
            HttpContext = Context,
            ProblemDetails = Problemas.Criar(StatusCodes.Status401Unauthorized, CodigosErro.NaoAutenticado,
                resultado.Failure?.Message ?? "Não autenticado.")
        });
    }

    /// <summary>Comparação em tempo constante, para não vazar a chave por tempo de resposta.</summary>
    private static bool Iguais(string a, string b) =>
        CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(a), Encoding.UTF8.GetBytes(b));
}

public class UsuarioAtualHttp(IHttpContextAccessor acessor) : IUsuarioAtual
{
    public string? Uid => acessor.HttpContext?.User.FindFirst(Autenticacao.ClaimUid)?.Value;
}
