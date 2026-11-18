using System.Net.Http.Json;
using System.Text.Json;
using Colecity.Infrastructure;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Colecity.Tests.Api;

/// <summary>
/// Sobe a API completa em memória, com um arquivo SQLite temporário, geocodificação offline
/// e as tarefas em segundo plano desligadas (os testes as executam diretamente).
/// </summary>
public class ColecityApiFactory : WebApplicationFactory<Program>
{
    public const string ChaveServico = "chave-de-teste";
    public const string ChaveAdmin = "chave-admin-de-teste";
    public static readonly JsonSerializerOptions Json = JsonColecity.Opcoes;

    private readonly string _arquivoBanco = Path.Combine(Path.GetTempPath(), $"colecity-testes-{Guid.NewGuid():N}.db");

    protected virtual int RequisicoesPorMinuto => 10_000;

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Colecity", $"Data Source={_arquivoBanco};Pooling=False");
        builder.UseSetting("Seguranca:ServiceKey", ChaveServico);
        builder.UseSetting("Seguranca:AdminKey", ChaveAdmin);
        builder.UseSetting("SpTrans:Token", "");
        builder.UseSetting("Geocodificacao:Provedor", "Simulado");
        builder.UseSetting("Tarefas:Habilitadas", "false");
        builder.UseSetting("RateLimit:RequisicoesPorMinuto", RequisicoesPorMinuto.ToString());
    }

    /// <summary>Cliente como o BFF: com a credencial de serviço e, opcionalmente, o uid do usuário.</summary>
    public HttpClient Cliente(string? uid = null)
    {
        var cliente = CreateClient();
        cliente.DefaultRequestHeaders.Add("X-Service-Key", ChaveServico);
        if (uid is not null)
            cliente.DefaultRequestHeaders.Add("X-User-Id", uid);
        return cliente;
    }

    /// <summary>Cria um usuário novo no domínio e devolve um cliente autenticado como ele.</summary>
    public async Task<HttpClient> NovoUsuarioAsync(string? uid = null)
    {
        uid ??= $"uid-{Guid.NewGuid():N}";
        var cliente = Cliente(uid);
        var resposta = await cliente.PutAsJsonAsync("/api/v1/usuarios/me",
            new { nome = "Pessoa de Teste", email = $"{uid}@exemplo.com", aceiteTermosVersao = "2026-11" });
        resposta.EnsureSuccessStatusCode();
        return cliente;
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        File.Delete(_arquivoBanco);
    }
}

public sealed class ColecityApiComLimiteFactory : ColecityApiFactory
{
    protected override int RequisicoesPorMinuto => 3;
}

public static class HttpExtensions
{
    public static async Task<T> LerAsync<T>(this HttpResponseMessage resposta) =>
        (await resposta.Content.ReadFromJsonAsync<T>(ColecityApiFactory.Json))!;

    public static async Task<string?> CodigoAsync(this HttpResponseMessage resposta) =>
        (await resposta.Content.ReadFromJsonAsync<JsonElement>()).TryGetProperty("code", out var codigo) ? codigo.GetString() : null;
}
