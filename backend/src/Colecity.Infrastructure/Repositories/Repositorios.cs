using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Repositories;

public class UsuarioRepository(ColecityDbContext db) : IUsuarioRepository
{
    public Task<Usuario?> ObterPorUidAsync(string uid, CancellationToken ct = default) =>
        db.Usuarios.FirstOrDefaultAsync(u => u.Uid == uid, ct);

    public Task<bool> EmailEmUsoAsync(string email, Guid? exceto, CancellationToken ct = default) =>
        db.Usuarios.AnyAsync(u => u.Email == email && (exceto == null || u.Id != exceto), ct);

    public async Task AdicionarAsync(Usuario usuario, CancellationToken ct = default) =>
        await db.Usuarios.AddAsync(usuario, ct);
}

public class OcorrenciaRepository(ColecityDbContext db) : IOcorrenciaRepository
{
    private static readonly TimeSpan MenorPrazoDeInatividade = TimeSpan.FromDays(7);
    private static readonly TimeSpan JanelaSeguranca = OcorrenciaSeguranca.JanelaDoRelato;

    public Task<Ocorrencia?> ObterAsync(Guid id, CancellationToken ct = default) =>
        db.Ocorrencias.Include(o => o.Participacoes).FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken ct = default) =>
        await db.Ocorrencias.AddAsync(ocorrencia, ct);

    public async Task<IReadOnlyList<Ocorrencia>> ListarComParticipacaoDeAsync(Guid usuarioId, CancellationToken ct = default) =>
        await db.Ocorrencias
            .Include(o => o.Participacoes)
            .Where(o => o.Participacoes.Any(p => p.UsuarioId == usuarioId))
            .ToListAsync(ct);

    /// <summary>Pré-filtro no banco; a decisão final é da política de cada categoria.</summary>
    public async Task<IReadOnlyList<Ocorrencia>> ListarCandidatasAoEncerramentoAsync(DateTime agora, CancellationToken ct = default)
    {
        var semAtividadeDesde = agora - MenorPrazoDeInatividade;
        var criadaAntesDe = agora - JanelaSeguranca;
        return await db.Ocorrencias
            .Where(o => o.Estado != EstadoOcorrencia.Concluida
                        && (o.UltimaAtividadeEm <= semAtividadeDesde || o.CriadoEm <= criadaAntesDe))
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<Ocorrencia>> ListarComEnderecoPendenteAsync(int maximo, CancellationToken ct = default) =>
        await db.Ocorrencias.Where(o => o.EnderecoPendente).OrderBy(o => o.CriadoEm).Take(maximo).ToListAsync(ct);

    public Task<OcorrenciaTransporte?> ObterDesvioAtivoDaLinhaAsync(string linhaCodigo, CancellationToken ct = default) =>
        db.Ocorrencias.OfType<OcorrenciaTransporte>()
            .Include(o => o.Participacoes)
            .Where(o => o.LinhaCodigo == linhaCodigo
                        && o.Tipo == TipoOcorrencia.AlteracaoRotaSemAviso
                        && o.Estado != EstadoOcorrencia.Concluida
                        && !o.Oculta)
            .OrderByDescending(o => o.UltimaAtividadeEm)
            .FirstOrDefaultAsync(ct);

    /// <summary>Fotos são owned: carrega o dono (ocorrência ou comentário) e devolve a foto rastreada.</summary>
    public async Task<Foto?> ObterFotoAsync(Guid fotoId, CancellationToken ct = default)
    {
        var ocorrencia = await db.Ocorrencias
            .FirstOrDefaultAsync(o => o.Fotos.Any(f => f.Id == fotoId) || o.FotosConclusao.Any(f => f.Id == fotoId), ct);
        if (ocorrencia is not null)
            return ocorrencia.Fotos.Concat(ocorrencia.FotosConclusao).First(f => f.Id == fotoId);

        var comentario = await db.Comentarios.FirstOrDefaultAsync(c => c.Fotos.Any(f => f.Id == fotoId), ct);
        return comentario?.Fotos.First(f => f.Id == fotoId);
    }
}

public class ComentarioRepository(ColecityDbContext db) : IComentarioRepository
{
    public Task<Comentario?> ObterAsync(Guid id, CancellationToken ct = default) =>
        db.Comentarios.FirstOrDefaultAsync(c => c.Id == id, ct);

    public async Task AdicionarAsync(Comentario comentario, CancellationToken ct = default) =>
        await db.Comentarios.AddAsync(comentario, ct);

    public void Remover(Comentario comentario) => db.Comentarios.Remove(comentario);
}

public class DenunciaRepository(ColecityDbContext db) : IDenunciaRepository
{
    public Task<bool> ExisteAsync(TipoConteudo tipo, Guid conteudoId, Guid usuarioId, CancellationToken ct = default) =>
        db.Denuncias.AnyAsync(d => d.TipoConteudo == tipo && d.ConteudoId == conteudoId && d.UsuarioId == usuarioId, ct);

    public Task<int> ContarContasPendentesAsync(TipoConteudo tipo, Guid conteudoId, CancellationToken ct = default) =>
        db.Denuncias
            .Where(d => d.TipoConteudo == tipo && d.ConteudoId == conteudoId && !d.Revisada)
            .Select(d => d.UsuarioId)
            .Distinct()
            .CountAsync(ct);

    public async Task<IReadOnlyList<Denuncia>> ListarPendentesAsync(Guid? conteudoId = null, CancellationToken ct = default) =>
        await db.Denuncias
            .Where(d => !d.Revisada && (conteudoId == null || d.ConteudoId == conteudoId))
            .ToListAsync(ct);

    public async Task AdicionarAsync(Denuncia denuncia, CancellationToken ct = default) =>
        await db.Denuncias.AddAsync(denuncia, ct);
}

public class ZonaAtencaoRepository(ColecityDbContext db) : IZonaAtencaoRepository
{
    public async Task SubstituirTodasAsync(IReadOnlyList<ZonaAtencao> zonas, CancellationToken ct = default)
    {
        db.ZonasAtencao.RemoveRange(await db.ZonasAtencao.ToListAsync(ct));
        await db.ZonasAtencao.AddRangeAsync(zonas, ct);
    }
}

public class LinhaRepository(ColecityDbContext db) : ILinhaRepository
{
    public Task<LinhaOnibus?> ObterAsync(string codigo, CancellationToken ct = default) =>
        db.Linhas.AsNoTracking().Include(l => l.Sentidos).FirstOrDefaultAsync(l => l.Codigo == codigo, ct);

    public async Task<IReadOnlyList<LinhaOnibus>> BuscarAsync(string termo, int maximo, CancellationToken ct = default)
    {
        var padrao = $"%{termo}%";
        return await db.Linhas.AsNoTracking()
            .Include(l => l.Sentidos)
            .Where(l => EF.Functions.Like(l.Codigo, padrao) || EF.Functions.Like(l.Nome, padrao))
            .OrderBy(l => l.Codigo)
            .Take(maximo)
            .ToListAsync(ct);
    }

    public async Task<IReadOnlyList<PontoTrajeto>> ObterTrajetoAsync(string codigo, int sentido, CancellationToken ct = default)
    {
        var shapeId = await db.SentidosLinha
            .Where(s => s.LinhaCodigo == codigo && s.Sentido == sentido)
            .Select(s => s.ShapeId)
            .FirstOrDefaultAsync(ct);
        if (shapeId is null)
            return [];

        return await db.PontosTrajeto.AsNoTracking()
            .Where(p => p.ShapeId == shapeId)
            .OrderBy(p => p.Sequencia)
            .ToListAsync(ct);
    }

    public Task<bool> PossuiDadosAsync(CancellationToken ct = default) => db.Linhas.AnyAsync(ct);

    /// <summary>Troca todo o GTFS de uma vez. Deve rodar dentro de uma transação (ver GtfsImportador).</summary>
    public async Task SubstituirTudoAsync(IReadOnlyList<LinhaOnibus> linhas, IReadOnlyList<PontoTrajeto> pontos, CancellationToken ct = default)
    {
        await db.PontosTrajeto.ExecuteDeleteAsync(ct);
        await db.SentidosLinha.ExecuteDeleteAsync(ct);
        await db.Linhas.ExecuteDeleteAsync(ct);
        await db.Linhas.AddRangeAsync(linhas, ct);
        await db.PontosTrajeto.AddRangeAsync(pontos, ct);
    }
}

public class ViagemRepository(ColecityDbContext db) : IViagemRepository
{
    /// <summary>Posições suficientes para avaliar desvio (3) e parada fora do trajeto (10 min).</summary>
    private const int PosicoesRecentes = 15;

    public Task<Viagem?> ObterAsync(Guid id, CancellationToken ct = default) =>
        db.Viagens
            .Include(v => v.Posicoes.OrderByDescending(p => p.RegistradaEm).Take(PosicoesRecentes))
            .FirstOrDefaultAsync(v => v.Id == id, ct);

    public Task<Viagem?> ObterAtivaDoUsuarioAsync(Guid usuarioId, DateTime agora, CancellationToken ct = default) =>
        db.Viagens
            .Where(v => v.UsuarioId == usuarioId && v.EncerradaEm == null && v.ExpiraEm > agora)
            .OrderByDescending(v => v.CriadoEm)
            .FirstOrDefaultAsync(ct);

    public async Task<IReadOnlyList<Viagem>> ListarDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default) =>
        await db.Viagens.Where(v => v.UsuarioId == usuarioId).ToListAsync(ct);

    public async Task AdicionarAsync(Viagem viagem, CancellationToken ct = default) =>
        await db.Viagens.AddAsync(viagem, ct);

    public void Remover(Viagem viagem) => db.Viagens.Remove(viagem);
}
