using Colecity.Application.Abstractions;
using Microsoft.Extensions.Caching.Memory;

namespace Colecity.Infrastructure.SpTrans;

/// <summary>
/// Decorator que guarda as respostas da Olho Vivo: posições por 15 s (RN-TAV-03) e linhas por 1 hora,
/// poupando a cota da API quando muitas pessoas olham a mesma linha.
/// </summary>
public class SpTransComCache(ISpTransClient interno, IMemoryCache cache) : ISpTransClient
{
    private static readonly TimeSpan ValidadePosicoes = TimeSpan.FromSeconds(15);
    private static readonly TimeSpan ValidadeLinhas = TimeSpan.FromHours(1);

    public async Task<IReadOnlyList<LinhaSpTrans>> BuscarLinhasAsync(string termo, CancellationToken ct = default) =>
        (await cache.GetOrCreateAsync($"sptrans:linhas:{termo.ToUpperInvariant()}", entrada =>
        {
            entrada.AbsoluteExpirationRelativeToNow = ValidadeLinhas;
            return interno.BuscarLinhasAsync(termo, ct);
        }))!;

    public async Task<PosicaoLinhaSpTrans> ObterPosicaoVeiculosAsync(int codigoLinha, CancellationToken ct = default) =>
        (await cache.GetOrCreateAsync($"sptrans:posicao:{codigoLinha}", entrada =>
        {
            entrada.AbsoluteExpirationRelativeToNow = ValidadePosicoes;
            return interno.ObterPosicaoVeiculosAsync(codigoLinha, ct);
        }))!;
}
