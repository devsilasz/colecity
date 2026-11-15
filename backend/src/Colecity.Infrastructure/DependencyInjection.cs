using System.Net;
using Colecity.Application.Abstractions;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Consultas;
using Colecity.Infrastructure.Data;
using Colecity.Infrastructure.Repositories;
using Colecity.Infrastructure.SpTrans;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Colecity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Colecity") ?? "Data Source=colecity.db";
        services.AddDbContext<ColecityDbContext>(options => options.UseSqlite(connectionString));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ColecityDbContext>());
        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IOcorrenciaRepository, OcorrenciaRepository>();
        services.AddScoped<IPainelConsultas, PainelConsultas>();

        AddSpTrans(services, configuration);
        return services;
    }

    private static void AddSpTrans(IServiceCollection services, IConfiguration configuration)
    {
        var secao = configuration.GetSection(SpTransOptions.Secao);
        services.Configure<SpTransOptions>(secao);
        var opcoes = secao.Get<SpTransOptions>() ?? new SpTransOptions();

        if (string.IsNullOrWhiteSpace(opcoes.Token))
        {
            services.AddSingleton<ISpTransClient, SpTransSimuladoClient>();
            return;
        }

        // O cookie de autenticação da Olho Vivo precisa sobreviver à troca de handlers do HttpClientFactory.
        services.AddSingleton<CookieContainer>();
        services.AddHttpClient<ISpTransClient, OlhoVivoSpTransClient>(client =>
            {
                client.BaseAddress = new Uri(opcoes.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
            {
                CookieContainer = sp.GetRequiredService<CookieContainer>(),
                UseCookies = true
            });
    }

    /// <summary>Aplica as migrations pendentes e popula o banco com os dados de demonstração.</summary>
    public static async Task InicializarBancoAsync(this IServiceProvider provider, bool popular, CancellationToken ct = default)
    {
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ColecityDbContext>();
        await db.Database.MigrateAsync(ct);
        if (popular)
            await DataSeeder.PopularAsync(db, ct);
    }
}
