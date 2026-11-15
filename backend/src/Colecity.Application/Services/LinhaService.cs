using Colecity.Application.Abstractions;
using Colecity.Application.Dtos;
using Colecity.Application.Exceptions;
using Colecity.Domain.Enums;
using Colecity.Domain.Repositories;

namespace Colecity.Application.Services;

/// <summary>Cruza os dados em tempo real da SPTrans com os relatos feitos no Colecity.</summary>
public class LinhaService(ISpTransClient spTrans, IOcorrenciaRepository ocorrencias) : ILinhaService
{
    public async Task<IReadOnlyList<LinhaResponse>> BuscarAsync(string termo, CancellationToken ct = default)
    {
        var linhas = await spTrans.BuscarLinhasAsync(termo, ct);
        return linhas
            .OrderBy(l => l.Letreiro).ThenBy(l => l.Sentido)
            .Select(l => new LinhaResponse(l.CodigoLinha, l.Letreiro, l.Sentido,
                l.Sentido == 1 ? l.TerminalPrincipal : l.TerminalSecundario, l.Destino))
            .ToList();
    }

    public async Task<SituacaoLinhaResponse> ObterSituacaoAsync(string letreiro, CancellationToken ct = default)
    {
        var codigo = letreiro.Trim().ToUpperInvariant();

        var sentidos = (await spTrans.BuscarLinhasAsync(codigo, ct))
            .Where(l => l.Letreiro.Equals(codigo, StringComparison.OrdinalIgnoreCase))
            .ToList();
        if (sentidos.Count == 0)
            throw new RecursoNaoEncontradoException("Linha", codigo);

        // Os dois sentidos da linha e os relatos do banco são consultados em paralelo.
        var posicoesTask = Task.WhenAll(sentidos.Select(s => spTrans.ObterPosicaoVeiculosAsync(s.CodigoLinha, ct)));
        var relatosTask = ocorrencias.ListarPorLinhaAsync(codigo, ct);
        await Task.WhenAll(posicoesTask, relatosTask);

        var posicoes = posicoesTask.Result;
        var relatosAtivos = relatosTask.Result.Where(o => o.Status != StatusOcorrencia.Resolvida).ToList();

        var porSentido = sentidos
            .Zip(posicoes, (linha, posicao) => new SentidoLinhaResponse(
                linha.Sentido, linha.Destino, posicao.Veiculos.Count, posicao.Veiculos.Count(v => v.Acessivel)))
            .ToList();

        var totalVeiculos = porSentido.Sum(s => s.VeiculosEmOperacao);
        var pessoasAfetadas = relatosAtivos.Sum(o => o.TotalApoios);
        var problemaMaisRelatado = relatosAtivos
            .GroupBy(o => o.TipoProblema)
            .OrderByDescending(g => g.Sum(o => o.TotalApoios))
            .Select(g => (TipoProblemaTransporte?)g.Key)
            .FirstOrDefault();

        return new SituacaoLinhaResponse(codigo, posicoes[0].HorarioReferencia, porSentido, totalVeiculos,
            relatosAtivos.Count, pessoasAfetadas, problemaMaisRelatado,
            MontarAlerta(totalVeiculos, pessoasAfetadas, problemaMaisRelatado));
    }

    private static string? MontarAlerta(int veiculos, int pessoas, TipoProblemaTransporte? problema) =>
        (veiculos, problema) switch
        {
            (0, TipoProblemaTransporte.NaoPassou or TipoProblemaTransporte.Atraso) =>
                $"SPTrans não mostra ônibus em operação e {pessoas} pessoa(s) relatam que a linha não está passando.",
            (0, _) => "SPTrans não mostra ônibus em operação nesta linha agora.",
            (_, not null) => $"{pessoas} pessoa(s) relatam problemas nesta linha ({problema}).",
            _ => null
        };
}
