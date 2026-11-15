using Colecity.Domain.Entities;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Repositories;

public class UsuarioRepository(ColecityDbContext db) : IUsuarioRepository
{
    public Task<Usuario?> ObterPorIdAsync(Guid id, CancellationToken ct = default) =>
        db.Usuarios.AsNoTracking().FirstOrDefaultAsync(u => u.Id == id, ct);

    public async Task<IReadOnlyList<Usuario>> ListarAsync(CancellationToken ct = default) =>
        await db.Usuarios.AsNoTracking().OrderBy(u => u.Nome).ToListAsync(ct);

    public Task<bool> ExisteAsync(Guid id, CancellationToken ct = default) =>
        db.Usuarios.AnyAsync(u => u.Id == id, ct);

    public Task<bool> EmailEmUsoAsync(string email, CancellationToken ct = default) =>
        db.Usuarios.AnyAsync(u => u.Email == email, ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await db.Usuarios.AddAsync(usuario, ct);
}
