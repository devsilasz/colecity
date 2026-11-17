using Colecity.Application.Abstractions;
using Colecity.Application.Services;
using Colecity.Domain.Entities;
using Colecity.Infrastructure.Consultas;
using Colecity.Infrastructure.Data;
using Colecity.Infrastructure.Geocodificacao;
using Colecity.Infrastructure.Repositories;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Aplicacao;

/// <summary>Monta os serviços reais sobre um banco SQLite em memória, como numa requisição.</summary>
public sealed class CenarioAplicacao : IDisposable
{
    private readonly BancoEmMemoria _banco = new();

    public RelogioFixo Relogio { get; } = new(Fabrica.Agora);

    public ColecityDbContext NovoContexto() => _banco.CriarContexto();

    public async Task<Usuario> CadastrarAsync(string apelido)
    {
        await using var db = NovoContexto();
        var usuario = Fabrica.Usuario(apelido);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        return usuario;
    }

    public async Task SalvarAsync(params Ocorrencia[] ocorrencias)
    {
        await using var db = NovoContexto();
        db.Ocorrencias.AddRange(ocorrencias);
        await db.SaveChangesAsync();
    }

    public sealed record Servicos(
        ColecityDbContext Db,
        IOcorrenciaService Ocorrencias,
        IParticipacaoService Participacoes,
        IComentarioService Comentarios,
        IUsuarioService Usuarios,
        IModeracaoService Moderacao) : IDisposable
    {
        public void Dispose() => Db.Dispose();
    }

    /// <summary>Serviços "como" o usuário informado (ou visitante, com <c>null</c>).</summary>
    public Servicos Como(Usuario? usuario)
    {
        var db = NovoContexto();
        var contexto = new ContextoUsuario(new UsuarioFixo(usuario?.Uid), new UsuarioRepository(db));
        var ocorrencias = new OcorrenciaRepository(db);
        var comentarios = new ComentarioRepository(db);
        var consultas = new OcorrenciaConsultas(db);
        return new Servicos(
            db,
            new OcorrenciaService(contexto, ocorrencias, consultas, new LinhaRepository(db), new GeocodificadorSimulado(), db, Relogio),
            new ParticipacaoService(contexto, ocorrencias, db, Relogio),
            new ComentarioService(contexto, ocorrencias, comentarios, consultas, db, Relogio),
            new UsuarioService(contexto, new UsuarioRepository(db), ocorrencias, new ViagemRepository(db), consultas, db, Relogio),
            new ModeracaoService(contexto, new DenunciaRepository(db), ocorrencias, comentarios, db, Relogio));
    }

    public void Dispose() => _banco.Dispose();

    private sealed record UsuarioFixo(string? Uid) : IUsuarioAtual;
}
