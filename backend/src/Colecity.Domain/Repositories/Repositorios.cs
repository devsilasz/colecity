using Colecity.Domain.Entities;
using Colecity.Domain.Enums;

namespace Colecity.Domain.Repositories;

public interface IUnitOfWork
{
    Task SalvarAsync(CancellationToken ct = default);
}

public interface IUsuarioRepository
{
    Task<Usuario?> ObterPorUidAsync(string uid, CancellationToken ct = default);
    Task<bool> EmailEmUsoAsync(string email, Guid? exceto, CancellationToken ct = default);
    Task AdicionarAsync(Usuario usuario, CancellationToken ct = default);
}

public interface IOcorrenciaRepository
{
    /// <summary>Carrega o agregado completo (participações e fotos) para alteração.</summary>
    Task<Ocorrencia?> ObterAsync(Guid id, CancellationToken ct = default);
    Task AdicionarAsync(Ocorrencia ocorrencia, CancellationToken ct = default);
    Task<IReadOnlyList<Ocorrencia>> ListarComParticipacaoDeAsync(Guid usuarioId, CancellationToken ct = default);
    Task<IReadOnlyList<Ocorrencia>> ListarCandidatasAoEncerramentoAsync(DateTime agora, CancellationToken ct = default);
    Task<IReadOnlyList<Ocorrencia>> ListarComEnderecoPendenteAsync(int maximo, CancellationToken ct = default);
    Task<OcorrenciaTransporte?> ObterDesvioAtivoDaLinhaAsync(string linhaCodigo, CancellationToken ct = default);
    Task<Foto?> ObterFotoAsync(Guid fotoId, CancellationToken ct = default);
}

public interface IComentarioRepository
{
    Task<Comentario?> ObterAsync(Guid id, CancellationToken ct = default);
    Task AdicionarAsync(Comentario comentario, CancellationToken ct = default);
    void Remover(Comentario comentario);
}

public interface IDenunciaRepository
{
    Task<bool> ExisteAsync(TipoConteudo tipo, Guid conteudoId, Guid usuarioId, CancellationToken ct = default);
    Task<int> ContarContasPendentesAsync(TipoConteudo tipo, Guid conteudoId, CancellationToken ct = default);
    Task<IReadOnlyList<Denuncia>> ListarPendentesAsync(Guid? conteudoId = null, CancellationToken ct = default);
    Task AdicionarAsync(Denuncia denuncia, CancellationToken ct = default);
}

public interface IZonaAtencaoRepository
{
    Task SubstituirTodasAsync(IReadOnlyList<ZonaAtencao> zonas, CancellationToken ct = default);
}

public interface ILinhaRepository
{
    Task<LinhaOnibus?> ObterAsync(string codigo, CancellationToken ct = default);
    Task<IReadOnlyList<LinhaOnibus>> BuscarAsync(string termo, int maximo, CancellationToken ct = default);
    Task<IReadOnlyList<PontoTrajeto>> ObterTrajetoAsync(string codigo, int sentido, CancellationToken ct = default);
    Task<bool> PossuiDadosAsync(CancellationToken ct = default);
    Task SubstituirTudoAsync(IReadOnlyList<LinhaOnibus> linhas, IReadOnlyList<PontoTrajeto> pontos, CancellationToken ct = default);
}

public interface IViagemRepository
{
    /// <summary>Carrega a viagem com as posições mais recentes, o suficiente para as regras de desvio.</summary>
    Task<Viagem?> ObterAsync(Guid id, CancellationToken ct = default);
    Task<Viagem?> ObterAtivaDoUsuarioAsync(Guid usuarioId, DateTime agora, CancellationToken ct = default);
    Task<IReadOnlyList<Viagem>> ListarDoUsuarioAsync(Guid usuarioId, CancellationToken ct = default);
    Task AdicionarAsync(Viagem viagem, CancellationToken ct = default);
    void Remover(Viagem viagem);
}
