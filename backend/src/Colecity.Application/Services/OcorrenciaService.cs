using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

public interface IOcorrenciaService
{
    IReadOnlyList<CategoriaResponse> ListarCategorias();
    Task<Pagina<OcorrenciaResumoResponse>> ListarAsync(ConsultaOcorrencias consulta, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse> ObterAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<EventoLinhaDoTempoResponse>> LinhaDoTempoAsync(Guid id, CancellationToken ct = default);
    Task<Pagina<ApoiadorResponse>> ApoiadoresAsync(Guid id, int? page, int? pageSize, CancellationToken ct = default);
    Task<IReadOnlyList<OcorrenciaSemelhanteResponse>> SemelhantesAsync(SemelhantesRequest request, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse> RegistrarAsync(RegistrarOcorrenciaRequest request, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse> EditarAsync(Guid id, EditarOcorrenciaRequest request, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse> ConcluirAsync(Guid id, ConcluirOcorrenciaRequest request, CancellationToken ct = default);
    Task<OcorrenciaDetalheResponse> ReabrirAsync(Guid id, CancellationToken ct = default);
}

/// <summary>Parâmetros de <c>GET /ocorrencias</c> como chegam na requisição.</summary>
public sealed record ConsultaOcorrencias(
    IReadOnlyCollection<Categoria>? Categorias,
    IReadOnlyCollection<EstadoOcorrencia>? Estados,
    double? Lat,
    double? Lng,
    int? RaioKm,
    string? Linha,
    int? Page,
    int? PageSize);

public class OcorrenciaService(
    ContextoUsuario contexto,
    IOcorrenciaRepository ocorrencias,
    IOcorrenciaConsultas consultas,
    ILinhaRepository linhas,
    IGeocodificador geocodificador,
    IUnitOfWork unitOfWork,
    TimeProvider relogio) : IOcorrenciaService
{
    private static readonly int[] RaiosPermitidosKm = [1, 5, 10];
    private static readonly EstadoOcorrencia[] EstadosPadrao = [EstadoOcorrencia.Aberta, EstadoOcorrencia.EmAcompanhamento];

    private DateTime Agora => relogio.GetUtcNow().UtcDateTime;

    public IReadOnlyList<CategoriaResponse> ListarCategorias() =>
        CatalogoCategorias.Todas
            .Select(c => new CategoriaResponse(c.Categoria, c.Nome, c.Tipos.Select(t => new TipoResponse(t.Tipo, t.Nome)).ToList()))
            .ToList();

    /// <summary>Consulta aberta a visitantes (RN-CSL-01), com filtros de RN-CSL-03 e RN-CSL-04.</summary>
    public async Task<Pagina<OcorrenciaResumoResponse>> ListarAsync(ConsultaOcorrencias consulta, CancellationToken ct = default)
    {
        var geo = new[] { consulta.Lat.HasValue, consulta.Lng.HasValue, consulta.RaioKm.HasValue };
        if (geo.Distinct().Count() > 1)
            throw new RequisicaoInvalidaException("Informe lat, lng e raioKm juntos.", "raioKm");
        if (consulta.RaioKm is { } raio && !RaiosPermitidosKm.Contains(raio))
            throw new RequisicaoInvalidaException("raioKm deve ser 1, 5 ou 10.", "raioKm");

        var (page, pageSize) = Pagina<OcorrenciaResumoResponse>.Normalizar(consulta.Page, consulta.PageSize);
        var centro = consulta.Lat is { } lat && consulta.Lng is { } lng ? new Coordenada(lat, lng) : null;
        var filtro = new FiltroOcorrencias(
            consulta.Categorias ?? [],
            consulta.Estados is { Count: > 0 } estados ? estados : EstadosPadrao,
            centro, consulta.RaioKm, Texto.CodigoLinha(consulta.Linha), page, pageSize);

        var usuario = await contexto.ObterOpcionalAsync(ct);
        return await consultas.ListarAsync(filtro, usuario?.Id, ct);
    }

    public async Task<OcorrenciaDetalheResponse> ObterAsync(Guid id, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterOpcionalAsync(ct);
        return await consultas.ObterDetalheAsync(id, usuario?.Id, Agora, ct) ?? throw new NaoEncontradoException("Ocorrência");
    }

    public async Task<IReadOnlyList<EventoLinhaDoTempoResponse>> LinhaDoTempoAsync(Guid id, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterOpcionalAsync(ct);
        return await consultas.LinhaDoTempoAsync(id, usuario?.Id, ct) ?? throw new NaoEncontradoException("Ocorrência");
    }

    public async Task<Pagina<ApoiadorResponse>> ApoiadoresAsync(Guid id, int? page, int? pageSize, CancellationToken ct = default)
    {
        var (pagina, tamanho) = Pagina<ApoiadorResponse>.Normalizar(page, pageSize);
        var usuario = await contexto.ObterOpcionalAsync(ct);
        return await consultas.ApoiadoresAsync(id, usuario?.Id, pagina, tamanho, ct) ?? throw new NaoEncontradoException("Ocorrência");
    }

    /// <summary>Sugestões durante o registro (RN-SEM). Segurança nunca sugere (RN-SEM-04).</summary>
    public async Task<IReadOnlyList<OcorrenciaSemelhanteResponse>> SemelhantesAsync(SemelhantesRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        new CamposObrigatorios()
            .Exigir(request.Categoria, "categoria")
            .Exigir(request.Tipo, "tipo")
            .Exigir(request.Localizacao, "localizacao")
            .Validar();

        var (categoria, tipo) = (request.Categoria!.Value, request.Tipo!.Value);
        if (!CatalogoCategorias.Pertence(tipo, categoria))
            throw new DomainException(CodigosErro.TipoInvalidoParaCategoria, "O tipo informado não pertence à categoria.", "tipo");
        var local = GarantirNoMunicipio(request.Localizacao!);

        if (categoria == Categoria.Seguranca)
            return [];

        var criterio = new CriterioSemelhantes(categoria, tipo, local, Texto.CodigoLinha(request.Linha));
        return await consultas.SemelhantesAsync(criterio, usuario.Id, Agora, ct);
    }

    /// <summary>Registro de ocorrência (RN-REG). Título por geocodificação reversa; autor vira afetado.</summary>
    public async Task<OcorrenciaDetalheResponse> RegistrarAsync(RegistrarOcorrenciaRequest request, CancellationToken ct = default)
    {
        var autor = await contexto.ObterObrigatorioAsync(ct);
        new CamposObrigatorios()
            .Exigir(request.Categoria, "categoria")
            .Exigir(request.Tipo, "tipo")
            .Exigir(request.Descricao, "descricao")
            .Exigir(request.Localizacao, "localizacao")
            .Validar();

        var categoria = request.Categoria!.Value;
        var local = GarantirNoMunicipio(request.Localizacao!);
        var linha = await ResolverLinhaAsync(request.Linha, categoria, ct);
        var endereco = await geocodificador.ObterEnderecoAsync(local, ct);

        var ocorrencia = FabricaOcorrencias.Registrar(new NovaOcorrencia(
            categoria, request.Tipo!.Value, request.Descricao!, local, endereco, autor,
            request.Fotos.Paths() ?? [], Agora, linha,
            request.DataHoraOcorrido is { } data ? Texto.Utc(data) : null));

        await ocorrencias.AdicionarAsync(ocorrencia, ct);
        await unitOfWork.SalvarAsync(ct);
        return await DetalheAsync(ocorrencia.Id, autor.Id, ct);
    }

    public async Task<OcorrenciaDetalheResponse> EditarAsync(Guid id, EditarOcorrenciaRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var ocorrencia = await CarregarAsync(id, usuario.Id, ct);
        ocorrencia.Editar(usuario, request.Descricao, request.Fotos.Paths());
        await unitOfWork.SalvarAsync(ct);
        return await DetalheAsync(id, usuario.Id, ct);
    }

    public async Task<OcorrenciaDetalheResponse> ConcluirAsync(Guid id, ConcluirOcorrenciaRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var ocorrencia = await CarregarAsync(id, usuario.Id, ct);
        ocorrencia.Concluir(usuario, request.Feedback, request.Fotos.Paths(), Agora);
        await unitOfWork.SalvarAsync(ct);
        return await DetalheAsync(id, usuario.Id, ct);
    }

    public async Task<OcorrenciaDetalheResponse> ReabrirAsync(Guid id, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var ocorrencia = await CarregarAsync(id, usuario.Id, ct);
        ocorrencia.Reabrir(usuario, Agora);
        await unitOfWork.SalvarAsync(ct);
        return await DetalheAsync(id, usuario.Id, ct);
    }

    private async Task<Ocorrencia> CarregarAsync(Guid id, Guid usuarioId, CancellationToken ct)
    {
        var ocorrencia = await ocorrencias.ObterAsync(id, ct);
        // Conteúdo oculto pela moderação só é visível para o autor (doc 10, seção 4.3).
        if (ocorrencia is null || ocorrencia.Oculta && !ocorrencia.EhAutor(usuarioId))
            throw new NaoEncontradoException("Ocorrência");
        return ocorrencia;
    }

    private async Task<OcorrenciaDetalheResponse> DetalheAsync(Guid id, Guid usuarioId, CancellationToken ct) =>
        await consultas.ObterDetalheAsync(id, usuarioId, Agora, ct) ?? throw new NaoEncontradoException("Ocorrência");

    private async Task<LinhaReferencia?> ResolverLinhaAsync(string? codigo, Categoria categoria, CancellationToken ct)
    {
        if (Texto.CodigoLinha(codigo) is not { } normalizado)
            return null;
        if (categoria != Categoria.Transporte)
            throw new DomainException(CodigosErro.LinhaInvalida, "A linha só pode ser informada em ocorrências de Transporte.", "linha");

        var linha = await linhas.ObterAsync(normalizado, ct)
            ?? throw new DomainException(CodigosErro.LinhaInvalida, "Linha não encontrada no GTFS da SPTrans.", "linha");
        return new LinhaReferencia(linha.Codigo, linha.Nome);
    }

    private static Coordenada GarantirNoMunicipio(CoordenadaDto dto)
    {
        var local = dto.ParaDominio();
        if (!MunicipioSaoPaulo.Contem(local))
            throw new DomainException(CodigosErro.LocalizacaoForaDoMunicipio,
                "Por enquanto o Colecity funciona apenas na cidade de São Paulo.", "localizacao");
        return local;
    }
}
