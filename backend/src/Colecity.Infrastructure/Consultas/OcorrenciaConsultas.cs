using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
using Colecity.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Consultas;

/// <summary>
/// Projeções de leitura com LINQ to Entities. Regras aplicadas aqui: conteúdo oculto não aparece
/// (exceto ao autor), ordenação por participação e atividade (RN-DES-02) e localização aproximada (RN-CSL-08).
/// </summary>
public class OcorrenciaConsultas(ColecityDbContext db) : IOcorrenciaConsultas
{
    private const int MaximoSemelhantes = 5;
    private const double RaioSemelhantesMetros = 500;
    private static readonly TimeSpan JanelaAtividadeSemelhantes = TimeSpan.FromDays(7);

    public async Task<Pagina<OcorrenciaResumoResponse>> ListarAsync(FiltroOcorrencias filtro, Guid? usuarioId, CancellationToken ct = default)
    {
        var query = db.Ocorrencias.AsNoTracking().Where(o => !o.Oculta && filtro.Estados.Contains(o.Estado));
        if (filtro.Categorias.Count > 0)
            query = query.Where(o => filtro.Categorias.Contains(o.Categoria));
        if (filtro.Linha is { } linha)
            query = query.Where(o => o is OcorrenciaTransporte && ((OcorrenciaTransporte)o).LinhaCodigo == linha);

        int total;
        List<Ocorrencia> itens;
        if (filtro.Centro is { } centro && filtro.RaioKm is { } raioKm)
        {
            // Caixa delimitadora no banco e distância exata (Haversine) em memória.
            var raio = raioKm * 1000d;
            var caixa = CaixaDelimitadora.AoRedor(centro, raio);
            var candidatas = await DentroDa(query, caixa).ToListAsync(ct);
            var noRaio = OrdenarPorDestaque(candidatas.Where(o => o.Localizacao.DistanciaMetros(centro) <= raio)).ToList();
            total = noRaio.Count;
            itens = noRaio.Skip((filtro.Page - 1) * filtro.PageSize).Take(filtro.PageSize).ToList();
        }
        else
        {
            total = await query.CountAsync(ct);
            itens = await query
                .OrderByDescending(o => o.TotalAfetados + o.TotalApoios)
                .ThenByDescending(o => o.UltimaAtividadeEm)
                .Skip((filtro.Page - 1) * filtro.PageSize)
                .Take(filtro.PageSize)
                .ToListAsync(ct);
        }

        return new Pagina<OcorrenciaResumoResponse>(await ResumirAsync(itens, usuarioId, ct), filtro.Page, filtro.PageSize, total);
    }

    public async Task<OcorrenciaDetalheResponse?> ObterDetalheAsync(Guid id, Guid? usuarioId, DateTime agora, CancellationToken ct = default)
    {
        var o = await db.Ocorrencias.AsNoTracking()
            .Include(x => x.Participacoes.Where(p => p.UsuarioId == usuarioId))
            .FirstOrDefaultAsync(x => x.Id == id, ct);
        if (o is null || !Visivel(o, usuarioId))
            return null;

        var autor = await db.Usuarios.AsNoTracking()
            .Where(u => u.Id == o.AutorId)
            .Select(u => new { u.Nome, u.Removido })
            .FirstAsync(ct);
        var ehAutor = o.EhAutor(usuarioId ?? Guid.Empty);
        var zonas = await ZonasAsync(ct);

        return new OcorrenciaDetalheResponse
        {
            Id = o.Id,
            Titulo = o.Titulo,
            Categoria = o.Categoria,
            Tipo = o.Tipo,
            Estado = o.Estado,
            Bairro = o.Bairro,
            LocalizacaoAproximada = CoordenadaDto.De(o.LocalizacaoAproximada),
            TotalAfetados = o.TotalAfetados,
            TotalApoios = o.TotalApoios,
            UltimaAtividadeEm = o.UltimaAtividadeEm,
            ZonaAtencao = zonas.Any(z => z.Cobre(o.Categoria, o.Localizacao)),
            MinhaParticipacao = usuarioId is { } uid
                ? new MinhaParticipacaoResponse(o.Participa(uid, TipoParticipacao.Afetado), o.Participa(uid, TipoParticipacao.Apoio), ehAutor)
                : null,
            Descricao = o.Descricao,
            Rua = o.Rua,
            Linha = o is OcorrenciaTransporte { LinhaCodigo: { } codigo } t ? new LinhaOcorrenciaResponse(codigo, t.LinhaNome ?? codigo) : null,
            DataHoraOcorrido = o is OcorrenciaSeguranca s ? s.DataHoraOcorrido : null,
            Fotos = Visiveis(o.Fotos, ehAutor),
            Autor = new AutorResponse(autor.Removido ? Usuario.NomeUsuarioRemovido : autor.Nome!, autor.Removido),
            CriadaEm = o.CriadoEm,
            ConcluidaEm = o.ConcluidaEm,
            Conclusao = o.MotivoConclusao is { } motivo
                ? new ConclusaoResponse(motivo, o.FeedbackConclusao, Visiveis(o.FotosConclusao, ehAutor))
                : null,
            PodeEditar = o.PodeEditar(usuarioId),
            PodeConcluir = o.PodeConcluir(usuarioId),
            PodeReabrir = o.PodeReabrir(usuarioId, agora),
            AvisoContagem = Ocorrencia.AvisoContagem,
            Oculta = o.Oculta ? true : null
        };
    }

    public async Task<IReadOnlyList<EventoLinhaDoTempoResponse>?> LinhaDoTempoAsync(Guid id, Guid? usuarioId, CancellationToken ct = default)
    {
        if (!await ExisteVisivelAsync(id, usuarioId, ct))
            return null;

        var eventos = await db.EventosLinhaDoTempo.AsNoTracking()
            .Where(e => e.OcorrenciaId == id)
            .OrderBy(e => e.CriadoEm)
            .ToListAsync(ct);
        return eventos
            .Select(e => new EventoLinhaDoTempoResponse(e.Tipo, e.Descricao, e.CriadoEm)
            {
                Trecho = e.Trecho?.Select(CoordenadaDto.De).ToList()
            })
            .ToList();
    }

    /// <summary>Lista pública de apoiadores (RN-PAR-06); vazia em Segurança (RN-PAR-07).</summary>
    public async Task<Pagina<ApoiadorResponse>?> ApoiadoresAsync(Guid id, Guid? usuarioId, int page, int pageSize, CancellationToken ct = default)
    {
        var ocorrencia = await db.Ocorrencias.AsNoTracking().FirstOrDefaultAsync(o => o.Id == id, ct);
        if (ocorrencia is null || !Visivel(ocorrencia, usuarioId))
            return null;
        if (!ocorrencia.ExibeApoiadores)
            return new Pagina<ApoiadorResponse>([], page, pageSize, 0);

        var apoiadores =
            from p in db.Participacoes
            join u in db.Usuarios on p.UsuarioId equals u.Id
            where p.OcorrenciaId == id && p.Tipo == TipoParticipacao.Apoio && !u.Removido
            orderby p.CriadoEm
            select u.Nome;

        var total = await apoiadores.CountAsync(ct);
        var nomes = await apoiadores.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new Pagina<ApoiadorResponse>(nomes.Select(n => new ApoiadorResponse(n!)).ToList(), page, pageSize, total);
    }

    /// <summary>
    /// RN-SEM-02/03/05: mesma categoria e tipo, não concluída, atividade nos últimos 7 dias, até 500 m
    /// (ou mesma linha, em Transporte), ordenadas por participação, no máximo 5.
    /// </summary>
    public async Task<IReadOnlyList<OcorrenciaSemelhanteResponse>> SemelhantesAsync(CriterioSemelhantes criterio, Guid usuarioId,
        DateTime agora, CancellationToken ct = default)
    {
        var desde = agora - JanelaAtividadeSemelhantes;
        var caixa = CaixaDelimitadora.AoRedor(criterio.Localizacao, RaioSemelhantesMetros);
        var linha = criterio.Linha;

        var candidatas = await db.Ocorrencias.AsNoTracking()
            .Where(o => !o.Oculta
                        && o.Estado != EstadoOcorrencia.Concluida
                        && o.Categoria == criterio.Categoria
                        && o.Tipo == criterio.Tipo
                        && o.UltimaAtividadeEm >= desde)
            .Where(o => (o.Localizacao.Lat >= caixa.MinLat && o.Localizacao.Lat <= caixa.MaxLat
                         && o.Localizacao.Lng >= caixa.MinLng && o.Localizacao.Lng <= caixa.MaxLng)
                        || (linha != null && o is OcorrenciaTransporte && ((OcorrenciaTransporte)o).LinhaCodigo == linha))
            .ToListAsync(ct);

        var semelhantes = candidatas
            .Select(o => (Ocorrencia: o, Distancia: o.Localizacao.DistanciaMetros(criterio.Localizacao)))
            .Where(x => x.Distancia <= RaioSemelhantesMetros || x.Ocorrencia is OcorrenciaTransporte { LinhaCodigo: { } l } && l == linha)
            .OrderByDescending(x => x.Ocorrencia.TotalAfetados + x.Ocorrencia.TotalApoios)
            .ThenBy(x => x.Distancia)
            .Take(MaximoSemelhantes)
            .ToList();

        var resumos = await ResumirAsync(semelhantes.Select(x => x.Ocorrencia).ToList(), usuarioId, ct);
        return resumos
            .Zip(semelhantes, (resumo, x) => ComoSemelhante(resumo, (int)Math.Round(x.Distancia)))
            .ToList();
    }

    /// <summary>Abas de "Minhas ocorrências": não concluídas primeiro, depois por atividade (RN-MIN-01, 02).</summary>
    public async Task<Pagina<OcorrenciaResumoResponse>> MinhasAsync(Guid usuarioId, AbaMinhas aba, int page, int pageSize, CancellationToken ct = default)
    {
        var query = aba switch
        {
            AbaMinhas.Registradas => db.Ocorrencias.Where(o => o.AutorId == usuarioId),
            AbaMinhas.Afetado => db.Ocorrencias.Where(o => o.Participacoes.Any(p => p.UsuarioId == usuarioId && p.Tipo == TipoParticipacao.Afetado)),
            _ => db.Ocorrencias.Where(o => o.Participacoes.Any(p => p.UsuarioId == usuarioId && p.Tipo == TipoParticipacao.Apoio))
        };

        var total = await query.CountAsync(ct);
        var itens = await query.AsNoTracking()
            .OrderBy(o => o.Estado == EstadoOcorrencia.Concluida ? 1 : 0)
            .ThenByDescending(o => o.UltimaAtividadeEm)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return new Pagina<OcorrenciaResumoResponse>(await ResumirAsync(itens, usuarioId, ct), page, pageSize, total);
    }

    /// <summary>Mais antigo primeiro (RN-COM-05), com selo "Afetado" (RN-COM-03).</summary>
    public async Task<Pagina<ComentarioResponse>?> ComentariosAsync(Guid ocorrenciaId, Guid? usuarioId, int page, int pageSize, CancellationToken ct = default)
    {
        if (!await ExisteVisivelAsync(ocorrenciaId, usuarioId, ct))
            return null;

        var query = db.Comentarios.AsNoTracking()
            .Where(c => c.OcorrenciaId == ocorrenciaId && (!c.Oculto || c.AutorId == usuarioId));
        var total = await query.CountAsync(ct);
        // Ocorrência concluída é só consulta: ninguém exclui comentário (decisão de 18/11/2026).
        var concluida = await db.Ocorrencias.AsNoTracking()
            .AnyAsync(o => o.Id == ocorrenciaId && o.Estado == EstadoOcorrencia.Concluida, ct);
        var comentarios = await query
            .OrderBy(c => c.CriadoEm)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);

        var autoresIds = comentarios.Select(c => c.AutorId).Distinct().ToList();
        var autores = await db.Usuarios.AsNoTracking()
            .Where(u => autoresIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, u => u.NomePublico, ct);
        var afetados = (await db.Participacoes
                .Where(p => p.OcorrenciaId == ocorrenciaId && p.Tipo == TipoParticipacao.Afetado && autoresIds.Contains(p.UsuarioId))
                .Select(p => p.UsuarioId)
                .ToListAsync(ct))
            .ToHashSet();

        var itens = comentarios.Select(c =>
        {
            var ehAutor = c.AutorId == usuarioId;
            var nome = autores[c.AutorId];
            return new ComentarioResponse(
                c.Id,
                c.Texto,
                Visiveis(c.Fotos, ehAutor),
                new AutorComentarioResponse(nome, afetados.Contains(c.AutorId), nome == Usuario.NomeUsuarioRemovido),
                c.CriadoEm,
                ehAutor && !concluida) { Oculto = c.Oculto ? true : null };
        }).ToList();

        return new Pagina<ComentarioResponse>(itens, page, pageSize, total);
    }

    private async Task<IReadOnlyList<OcorrenciaResumoResponse>> ResumirAsync(IReadOnlyList<Ocorrencia> itens, Guid? usuarioId, CancellationToken ct)
    {
        var ids = itens.Select(o => o.Id).ToList();
        var minhas = usuarioId is null
            ? []
            : await db.Participacoes
                .Where(p => p.UsuarioId == usuarioId && ids.Contains(p.OcorrenciaId))
                .Select(p => new { p.OcorrenciaId, p.Tipo })
                .ToListAsync(ct);
        var zonas = await ZonasAsync(ct);

        return itens.Select(o => new OcorrenciaResumoResponse
        {
            Id = o.Id,
            Titulo = o.Titulo,
            Categoria = o.Categoria,
            Tipo = o.Tipo,
            Estado = o.Estado,
            Bairro = o.Bairro,
            LocalizacaoAproximada = CoordenadaDto.De(o.LocalizacaoAproximada),
            TotalAfetados = o.TotalAfetados,
            TotalApoios = o.TotalApoios,
            UltimaAtividadeEm = o.UltimaAtividadeEm,
            ZonaAtencao = zonas.Any(z => z.Cobre(o.Categoria, o.Localizacao)),
            MinhaParticipacao = usuarioId is null
                ? null
                : new MinhaParticipacaoResponse(
                    minhas.Any(m => m.OcorrenciaId == o.Id && m.Tipo == TipoParticipacao.Afetado),
                    minhas.Any(m => m.OcorrenciaId == o.Id && m.Tipo == TipoParticipacao.Apoio),
                    o.AutorId == usuarioId)
        }).ToList();
    }

    private Task<List<ZonaAtencao>> ZonasAsync(CancellationToken ct) => db.ZonasAtencao.AsNoTracking().ToListAsync(ct);

    private Task<bool> ExisteVisivelAsync(Guid id, Guid? usuarioId, CancellationToken ct) =>
        db.Ocorrencias.AnyAsync(o => o.Id == id && (!o.Oculta || o.AutorId == usuarioId), ct);

    private static bool Visivel(Ocorrencia o, Guid? usuarioId) => !o.Oculta || o.AutorId == usuarioId;

    private static IQueryable<Ocorrencia> DentroDa(IQueryable<Ocorrencia> query, CaixaDelimitadora caixa) =>
        query.Where(o => o.Localizacao.Lat >= caixa.MinLat && o.Localizacao.Lat <= caixa.MaxLat
                         && o.Localizacao.Lng >= caixa.MinLng && o.Localizacao.Lng <= caixa.MaxLng);

    private static IEnumerable<Ocorrencia> OrdenarPorDestaque(IEnumerable<Ocorrencia> ocorrencias) =>
        ocorrencias.OrderByDescending(o => o.TotalAfetados + o.TotalApoios).ThenByDescending(o => o.UltimaAtividadeEm);

    private static IReadOnlyList<FotoResponse> Visiveis(IEnumerable<Foto> fotos, bool ehAutor) =>
        fotos.Where(f => !f.Oculta || ehAutor).Select(FotoResponse.De).ToList();

    private static OcorrenciaSemelhanteResponse ComoSemelhante(OcorrenciaResumoResponse r, int distancia) => new()
    {
        Id = r.Id,
        Titulo = r.Titulo,
        Categoria = r.Categoria,
        Tipo = r.Tipo,
        Estado = r.Estado,
        Bairro = r.Bairro,
        LocalizacaoAproximada = r.LocalizacaoAproximada,
        TotalAfetados = r.TotalAfetados,
        TotalApoios = r.TotalApoios,
        UltimaAtividadeEm = r.UltimaAtividadeEm,
        ZonaAtencao = r.ZonaAtencao,
        MinhaParticipacao = r.MinhaParticipacao,
        DistanciaMetros = distancia
    };
}
