using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Domain.Repositories;
using Colecity.Domain.Servicos;
using Microsoft.Extensions.Logging;

namespace Colecity.Application.Services;

public interface ITransporteService
{
    Task<IReadOnlyList<LinhaTransporteResponse>> BuscarLinhasAsync(string? busca, CancellationToken ct = default);
    Task<TrajetoResponse> TrajetoAsync(string codigo, int? sentido, CancellationToken ct = default);
    Task<IReadOnlyList<VeiculoResponse>> VeiculosAsync(string codigo, int? sentido, CancellationToken ct = default);
    Task<ViagemIniciadaResponse> IniciarViagemAsync(IniciarViagemRequest request, CancellationToken ct = default);
    Task<PosicaoRegistradaResponse> RegistrarPosicaoAsync(Guid viagemId, PosicaoViagemRequest request, CancellationToken ct = default);
    Task<DesvioRespondidoResponse> ResponderDesvioAsync(Guid viagemId, RespostaDesvioRequest request, CancellationToken ct = default);
    Task EncerrarViagemAsync(Guid viagemId, CancellationToken ct = default);
}

/// <summary>Transporte ao vivo (RN-TAV): GTFS, Olho Vivo, posições de passageiros e desvio de rota.</summary>
public class TransporteService(
    ContextoUsuario contexto,
    ILinhaRepository linhas,
    IViagemRepository viagens,
    IOcorrenciaRepository ocorrencias,
    ITransporteConsultas consultas,
    ISpTransClient spTrans,
    IGeocodificador geocodificador,
    IUnitOfWork unitOfWork,
    TimeProvider relogio,
    ILogger<TransporteService> logger) : ITransporteService
{
    private const int MinimoCaracteresBusca = 2;
    private const int MaximoLinhasNaBusca = 20;
    private static readonly TimeSpan JanelaPosicaoPassageiro = TimeSpan.FromMinutes(3);

    private DateTime Agora => relogio.GetUtcNow().UtcDateTime;

    public async Task<IReadOnlyList<LinhaTransporteResponse>> BuscarLinhasAsync(string? busca, CancellationToken ct = default)
    {
        var termo = busca?.Trim() ?? "";
        if (termo.Length < MinimoCaracteresBusca)
            throw new RequisicaoInvalidaException($"Digite ao menos {MinimoCaracteresBusca} caracteres.", "busca");

        var encontradas = await linhas.BuscarAsync(termo, MaximoLinhasNaBusca, ct);
        return encontradas.Select(l => new LinhaTransporteResponse(
                l.Codigo, l.Nome, l.Sentidos.OrderBy(s => s.Sentido).Select(s => new SentidoResponse(s.Sentido, s.Destino)).ToList()))
            .ToList();
    }

    public async Task<TrajetoResponse> TrajetoAsync(string codigo, int? sentido, CancellationToken ct = default)
    {
        var (linha, numeroSentido) = await ObterLinhaAsync(codigo, sentido, ct);
        var pontos = await linhas.ObterTrajetoAsync(linha.Codigo, numeroSentido, ct);
        return new TrajetoResponse(pontos.Select(p => new CoordenadaDto(p.Lat, p.Lng)).ToList());
    }

    /// <summary>Ônibus da SPTrans (cache de 15 s) + posições agregadas de passageiros (RN-TAV-03, RN-TAV-06).</summary>
    public async Task<IReadOnlyList<VeiculoResponse>> VeiculosAsync(string codigo, int? sentido, CancellationToken ct = default)
    {
        var (linha, numeroSentido) = await ObterLinhaAsync(codigo, sentido, ct);

        var sptransTask = VeiculosSpTransAsync(linha.Codigo, numeroSentido, ct);
        var passageirosTask = consultas.PosicoesRecentesAsync(linha.Codigo, numeroSentido, Agora - JanelaPosicaoPassageiro, Agora, ct);
        await Task.WhenAll(sptransTask, passageirosTask);

        var passageiros = AgregadorPosicoesPassageiros.Agregar(passageirosTask.Result)
            .Select(p => new VeiculoResponse(FontePosicao.Passageiros, null, CoordenadaDto.De(p.Posicao), p.AtualizadoEm, null));
        return sptransTask.Result.Concat(passageiros).ToList();
    }

    public async Task<ViagemIniciadaResponse> IniciarViagemAsync(IniciarViagemRequest request, CancellationToken ct = default)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        new CamposObrigatorios().Exigir(request.Linha, "linha").Exigir(request.Sentido, "sentido").Validar();

        var linha = await linhas.ObterAsync(Texto.CodigoLinha(request.Linha)!, ct);
        if (linha is null || linha.Sentidos.All(s => s.Sentido != request.Sentido))
            throw new DomainException(CodigosErro.LinhaInvalida, "Linha ou sentido não encontrado no GTFS da SPTrans.", "linha");

        // No máximo uma viagem ativa por usuário (RN-TAV-04).
        var ativa = await viagens.ObterAtivaDoUsuarioAsync(usuario.Id, Agora, ct);
        ativa?.Encerrar(MotivoEncerramentoViagem.NovaViagem, Agora);

        var viagem = new Viagem(usuario.Id, linha.Codigo, request.Sentido!.Value, Agora);
        await viagens.AdicionarAsync(viagem, ct);
        await unitOfWork.SalvarAsync(ct);
        return new ViagemIniciadaResponse(viagem.Id, viagem.ExpiraEm);
    }

    public async Task<PosicaoRegistradaResponse> RegistrarPosicaoAsync(Guid viagemId, PosicaoViagemRequest request, CancellationToken ct = default)
    {
        new CamposObrigatorios().Exigir(request.Posicao, "posicao").Validar();
        var viagem = await CarregarViagemAsync(viagemId, ct);
        var posicao = request.Posicao!.ParaDominio();

        var pontos = await linhas.ObterTrajetoAsync(viagem.LinhaCodigo, viagem.Sentido, ct);
        var distancia = pontos.Count >= 2
            ? new Trajeto(pontos.Select(p => new Coordenada(p.Lat, p.Lng)).ToList()).DistanciaMetros(posicao)
            : 0;

        var registradaEm = request.RegistradaEm is { } data && Texto.Utc(data) <= Agora ? Texto.Utc(data) : Agora;
        var resultado = viagem.RegistrarPosicao(posicao, registradaEm, distancia, Agora);
        await unitOfWork.SalvarAsync(ct);

        return new PosicaoRegistradaResponse(resultado.Ativa, resultado.DesvioSuspeito,
            resultado.TrechoDesvio?.Select(CoordenadaDto.De).ToList());
    }

    /// <summary>Com confirmação, cria ou reforça a ocorrência "Alteração de rota sem aviso" da linha (RN-TAV-07).</summary>
    public async Task<DesvioRespondidoResponse> ResponderDesvioAsync(Guid viagemId, RespostaDesvioRequest request, CancellationToken ct = default)
    {
        new CamposObrigatorios().Exigir(request.Confirmado, "confirmado").Validar();
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var viagem = await CarregarViagemAsync(viagemId, ct);

        var trecho = viagem.ResponderDesvio(request.Confirmado!.Value);
        if (trecho is null)
        {
            await unitOfWork.SalvarAsync(ct);
            return new DesvioRespondidoResponse(null);
        }

        var ocorrencia = await ocorrencias.ObterDesvioAtivoDaLinhaAsync(viagem.LinhaCodigo, ct)
                         ?? await CriarOcorrenciaDeDesvioAsync(usuario, viagem.LinhaCodigo, trecho, ct);
        ocorrencia.RegistrarDesvio(usuario, trecho, Agora);
        await unitOfWork.SalvarAsync(ct);
        return new DesvioRespondidoResponse(ocorrencia.Id);
    }

    public async Task EncerrarViagemAsync(Guid viagemId, CancellationToken ct = default)
    {
        var viagem = await CarregarViagemAsync(viagemId, ct);
        viagem.Encerrar(MotivoEncerramentoViagem.Usuario, Agora);
        await unitOfWork.SalvarAsync(ct);
    }

    private async Task<OcorrenciaTransporte> CriarOcorrenciaDeDesvioAsync(Usuario usuario, string codigoLinha,
        IReadOnlyList<Coordenada> trecho, CancellationToken ct)
    {
        var linha = await linhas.ObterAsync(codigoLinha, ct) ?? throw new NaoEncontradoException("Linha");
        var endereco = await geocodificador.ObterEnderecoAsync(trecho[0], ct);
        var ocorrencia = (OcorrenciaTransporte)FabricaOcorrencias.Registrar(new NovaOcorrencia(
            Categoria.Transporte, TipoOcorrencia.AlteracaoRotaSemAviso,
            $"Passageiros relataram que a linha {linha.Codigo} saiu do trajeto oficial.",
            trecho[0], endereco, usuario, [], Agora, new LinhaReferencia(linha.Codigo, linha.Nome)));
        await ocorrencias.AdicionarAsync(ocorrencia, ct);
        return ocorrencia;
    }

    private async Task<Viagem> CarregarViagemAsync(Guid viagemId, CancellationToken ct)
    {
        var usuario = await contexto.ObterObrigatorioAsync(ct);
        var viagem = await viagens.ObterAsync(viagemId, ct);
        // Viagem de outra pessoa é tratada como inexistente, para não revelar que ela existe.
        if (viagem is null || viagem.UsuarioId != usuario.Id)
            throw new NaoEncontradoException("Viagem");
        return viagem;
    }

    private async Task<(LinhaOnibus Linha, int Sentido)> ObterLinhaAsync(string codigo, int? sentido, CancellationToken ct)
    {
        var numeroSentido = sentido ?? 1;
        if (numeroSentido is not (1 or 2))
            throw new RequisicaoInvalidaException("sentido deve ser 1 ou 2.", "sentido");
        var linha = await linhas.ObterAsync(Texto.CodigoLinha(codigo)!, ct) ?? throw new NaoEncontradoException("Linha");
        return (linha, numeroSentido);
    }

    /// <summary>Falha da SPTrans não derruba a tela: os ônibus de passageiros continuam aparecendo.</summary>
    private async Task<IReadOnlyList<VeiculoResponse>> VeiculosSpTransAsync(string codigo, int sentido, CancellationToken ct)
    {
        try
        {
            var linha = (await spTrans.BuscarLinhasAsync(codigo, ct))
                .FirstOrDefault(l => l.Letreiro.Equals(codigo, StringComparison.OrdinalIgnoreCase) && l.Sentido == sentido);
            if (linha is null)
                return [];

            var posicao = await spTrans.ObterPosicaoVeiculosAsync(linha.CodigoLinha, ct);
            return posicao.Veiculos
                .Select(v => new VeiculoResponse(FontePosicao.Sptrans, v.Prefixo, new CoordenadaDto(v.Latitude, v.Longitude),
                    v.AtualizadoEm ?? Agora, v.Acessivel))
                .ToList();
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            logger.LogWarning(ex, "SPTrans indisponível ao consultar a linha {Linha}", codigo);
            return [];
        }
    }
}
