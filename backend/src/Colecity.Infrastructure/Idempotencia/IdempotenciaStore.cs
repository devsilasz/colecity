using Colecity.Application.Abstractions;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Idempotencia;

public class IdempotenciaStore(ColecityDbContext db) : IIdempotenciaStore
{
    public async Task<RespostaArmazenada?> ObterAsync(Guid usuarioId, string rota, string chave, DateTime desde, CancellationToken ct = default) =>
        await db.RegistrosIdempotencia.AsNoTracking()
            .Where(r => r.UsuarioId == usuarioId && r.Rota == rota && r.Chave == chave && r.CriadoEm >= desde)
            .Select(r => new RespostaArmazenada(r.StatusCode, r.Corpo))
            .FirstOrDefaultAsync(ct);

    public async Task SalvarAsync(Guid usuarioId, string rota, string chave, RespostaArmazenada resposta, DateTime agora, CancellationToken ct = default)
    {
        // Registros vencidos (mais de 24 h) com a mesma chave são substituídos.
        await db.RegistrosIdempotencia
            .Where(r => r.UsuarioId == usuarioId && r.Rota == rota && r.Chave == chave)
            .ExecuteDeleteAsync(ct);
        db.RegistrosIdempotencia.Add(new RegistroIdempotencia(usuarioId, rota, chave, resposta.StatusCode, resposta.Corpo, agora));
        await db.SaveChangesAsync(ct);
    }
}
