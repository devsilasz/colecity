using System.Net;
using Colecity.Application.Abstractions;
using Colecity.Application.Tarefas;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Consultas;
using Colecity.Infrastructure.Data;
using Colecity.Infrastructure.Eventos;
using Colecity.Infrastructure.Geocodificacao;
using Colecity.Infrastructure.Idempotencia;
using Colecity.Infrastructure.Repositories;
using Colecity.Infrastructure.SpTrans;
using Colecity.Infrastructure.Tarefas;
using Colecity.Infrastructure.Transporte;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Colecity") ?? "Data Source=colecity.db";
        services.AddDbContext<ColecityDbContext>(options => options.UseSqlite(connectionString,
            // Ocorrências carregam várias coleções (participações e fotos): uma consulta por coleção.
            sqlite => sqlite.UseQuerySplittingBehavior(QuerySplittingBehavior.SplitQuery)));
        services.AddScoped<IUnitOfWork>(sp => sp.GetRequiredService<ColecityDbContext>());
        services.AddMemoryCache();

        services.AddScoped<IUsuarioRepository, UsuarioRepository>();
        services.AddScoped<IOcorrenciaRepository, OcorrenciaRepository>();
        services.AddScoped<IComentarioRepository, ComentarioRepository>();
        services.AddScoped<IDenunciaRepository, DenunciaRepository>();
        services.AddScoped<IZonaAtencaoRepository, ZonaAtencaoRepository>();
        services.AddScoped<ILinhaRepository, LinhaRepository>();
        services.AddScoped<IViagemRepository, ViagemRepository>();
        services.AddScoped<IOcorrenciaConsultas, OcorrenciaConsultas>();
        services.AddScoped<IMapaConsultas, MapaConsultas>();
        services.AddScoped<ITransporteConsultas, TransporteConsultas>();
        services.AddScoped<IIdempotenciaStore, IdempotenciaStore>();

        services.Configure<GtfsOptions>(configuration.GetSection(GtfsOptions.Secao));
        services.AddScoped<GtfsImportador>();

        AddSpTrans(services, configuration);
        AddGeocodificacao(services, configuration);
        AddEventos(services, configuration);
        AddTarefas(services, configuration);
        return services;
    }

    private static void AddSpTrans(IServiceCollection services, IConfiguration configuration)
    {
        var secao = configuration.GetSection(SpTransOptions.Secao);
        services.Configure<SpTransOptions>(secao);
        var opcoes = secao.Get<SpTransOptions>() ?? new SpTransOptions();

        if (string.IsNullOrWhiteSpace(opcoes.Token))
        {
            services.AddSingleton<SpTransSimuladoClient>();
            services.AddScoped<ISpTransClient>(sp => new SpTransComCache(
                sp.GetRequiredService<SpTransSimuladoClient>(), sp.GetRequiredService<IMemoryCache>()));
            return;
        }

        // O cookie de autenticação da Olho Vivo precisa sobreviver à troca de handlers do HttpClientFactory.
        services.AddSingleton<CookieContainer>();
        services.AddHttpClient<OlhoVivoSpTransClient>(client =>
            {
                client.BaseAddress = new Uri(opcoes.BaseUrl);
                client.Timeout = TimeSpan.FromSeconds(10);
            })
            .ConfigurePrimaryHttpMessageHandler(sp => new HttpClientHandler
            {
                CookieContainer = sp.GetRequiredService<CookieContainer>(),
                UseCookies = true
            });
        services.AddScoped<ISpTransClient>(sp => new SpTransComCache(
            sp.GetRequiredService<OlhoVivoSpTransClient>(), sp.GetRequiredService<IMemoryCache>()));
    }

    private static void AddGeocodificacao(IServiceCollection services, IConfiguration configuration)
    {
        var opcoes = configuration.GetSection(GeocodificacaoOptions.Secao).Get<GeocodificacaoOptions>() ?? new GeocodificacaoOptions();
        if (opcoes.Provedor.Equals("Simulado", StringComparison.OrdinalIgnoreCase))
        {
            services.AddSingleton<IGeocodificador, GeocodificadorSimulado>();
            return;
        }

        services.AddHttpClient<IGeocodificador, NominatimGeocodificador>(client =>
        {
            client.BaseAddress = new Uri(opcoes.NominatimUrl);
            client.Timeout = TimeSpan.FromSeconds(opcoes.TimeoutSegundos);
            // Política de uso do Nominatim: identificar a aplicação.
            client.DefaultRequestHeaders.UserAgent.ParseAdd("Colecity/1.0 (projeto academico FIAP)");
        });
    }

    private static void AddEventos(IServiceCollection services, IConfiguration configuration)
    {
        var opcoes = configuration.GetSection(BffOptions.Secao).Get<BffOptions>() ?? new BffOptions();
        services.AddScoped<PublicadorEventosTarefa>();

        if (string.IsNullOrWhiteSpace(opcoes.EventosUrl))
        {
            services.AddScoped<IEnvioEventosBff, LogEnvioEventosBff>();
            return;
        }

        var chave = string.IsNullOrWhiteSpace(opcoes.ServiceKey) ? configuration["Seguranca:ServiceKey"] : opcoes.ServiceKey;
        services.AddHttpClient<IEnvioEventosBff, HttpEnvioEventosBff>(client =>
        {
            client.BaseAddress = new Uri(opcoes.EventosUrl);
            client.Timeout = TimeSpan.FromSeconds(10);
            client.DefaultRequestHeaders.Add("X-Service-Key", chave);
        });
    }

    private static void AddTarefas(IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<TarefasOptions>(configuration.GetSection(TarefasOptions.Secao));
        services.AddScoped<LimpezaTarefa>();

        services.AddHostedService<ExecutorTarefaPeriodica<EncerramentoAutomaticoTarefa>>();
        services.AddHostedService<ExecutorTarefaPeriodica<ZonasAtencaoTarefa>>();
        services.AddHostedService<ExecutorTarefaPeriodica<GeocodificacaoPendenteTarefa>>();
        services.AddHostedService<ExecutorTarefaPeriodica<PublicadorEventosTarefa>>();
        services.AddHostedService<ExecutorTarefaPeriodica<LimpezaTarefa>>();
        services.AddHostedService<ExecutorTarefaPeriodica<GtfsImportador>>();
    }

    /// <summary>Aplica as migrations, importa o GTFS e, se pedido, popula os dados de demonstração.</summary>
    public static async Task InicializarBancoAsync(this IServiceProvider provider, bool popular, CancellationToken ct = default)
    {
        await using var scope = provider.CreateAsyncScope();
        var db = scope.ServiceProvider.GetRequiredService<ColecityDbContext>();
        await db.Database.MigrateAsync(ct);
        await scope.ServiceProvider.GetRequiredService<GtfsImportador>().ImportarSeVazioAsync(ct);
        if (popular)
            await DataSeeder.PopularAsync(db, scope.ServiceProvider.GetRequiredService<TimeProvider>().GetUtcNow().UtcDateTime, ct);
    }
}
