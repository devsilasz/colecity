using Colecity.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace Colecity.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        services.AddSingleton(TimeProvider.System);
        services.AddScoped<IUsuarioService, UsuarioService>();
        services.AddScoped<IOcorrenciaService, OcorrenciaService>();
        services.AddScoped<ILinhaService, LinhaService>();
        services.AddScoped<IPainelService, PainelService>();
        return services;
    }
}
