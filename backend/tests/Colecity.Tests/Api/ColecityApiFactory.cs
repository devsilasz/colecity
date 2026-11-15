using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;

namespace Colecity.Tests.Api;

/// <summary>Sobe a API completa em memória, com um arquivo SQLite temporário por execução.</summary>
public sealed class ColecityApiFactory : WebApplicationFactory<Program>
{
    private readonly string _arquivoBanco = Path.Combine(Path.GetTempPath(), $"colecity-testes-{Guid.NewGuid():N}.db");

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.UseSetting("ConnectionStrings:Colecity", $"Data Source={_arquivoBanco};Pooling=False");
        builder.UseSetting("SpTrans:Token", "");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        File.Delete(_arquivoBanco);
    }
}
