using Colecity.Application.Services;
using Colecity.Application.Tarefas;
using Microsoft.Extensions.DependencyInjection;

namespace Colecity.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<ContextoUsuario>();
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IOcorrenciaService, OcorrenciaService>();
        services.AddScoped<IParticipacaoService, ParticipacaoService>();
        services.AddScoped<IComentarioService, ComentarioService>();
        services.AddScoped<IModeracaoService, ModeracaoService>();
        services.AddScoped<IMapaService, MapaService>();
        services.AddScoped<ITransporteService, TransporteService>();

        services.AddScoped<EncerramentoAutomaticoTarefa>();
        services.AddScoped<ZonasAtencaoTarefa>();
        services.AddScoped<GeocodificacaoPendenteTarefa>();
        return services;
    }
}
