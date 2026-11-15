using Colecity.Application.Exceptions;
using Colecity.Application.Services;
using Colecity.Domain.Enums;
using Colecity.Infrastructure.Consultas;
using Colecity.Infrastructure.Data;
using Colecity.Infrastructure.Repositories;
using Colecity.Infrastructure.SpTrans;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Aplicacao;

public sealed class PainelELinhaTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();

    public PainelELinhaTests()
    {
        using var db = _banco.CriarContexto();
        DataSeeder.PopularAsync(db).GetAwaiter().GetResult();
    }

    public void Dispose() => _banco.Dispose();

    [Fact]
    public async Task Indicadores_agregam_os_dados_do_banco()
    {
        await using var db = _banco.CriarContexto();

        var indicadores = await new PainelService(new PainelConsultas(db), new OcorrenciaRepository(db))
            .ObterIndicadoresAsync();

        Assert.Equal(6, indicadores.TotalOcorrencias);
        Assert.Equal(db.Apoios.Count(), indicadores.TotalApoios);
        Assert.Equal(Math.Round(100.0 / 6, 2), indicadores.TaxaResolucaoConfirmada);
        Assert.Equal(4, indicadores.PorModulo.Count);
        Assert.Equal("Jardim Ângela", indicadores.BairrosMaisAfetados[0].Bairro);
    }

    [Fact]
    public async Task Ranking_ordena_por_prioridade_e_ignora_resolvidas()
    {
        await using var db = _banco.CriarContexto();

        var ranking = await new PainelService(new PainelConsultas(db), new OcorrenciaRepository(db))
            .ObterRankingAsync(modulo: null, top: 10);

        Assert.Equal(5, ranking.Count);
        Assert.DoesNotContain(ranking, o => o.Status == StatusOcorrencia.Resolvida);
        Assert.Equal(ranking.OrderByDescending(o => o.Prioridade).Select(o => o.Id), ranking.Select(o => o.Id));
    }

    [Fact]
    public async Task Situacao_da_linha_cruza_sptrans_com_relatos()
    {
        await using var db = _banco.CriarContexto();
        var servico = new LinhaService(new SpTransSimuladoClient(TimeProvider.System), new OcorrenciaRepository(db));

        var situacao = await servico.ObterSituacaoAsync("6072-10");

        Assert.Equal(2, situacao.Sentidos.Count);
        Assert.Equal(0, situacao.TotalVeiculosEmOperacao);
        Assert.Equal(TipoProblemaTransporte.NaoPassou, situacao.ProblemaMaisRelatado);
        Assert.True(situacao.PessoasAfetadas >= 10);
        Assert.NotNull(situacao.Alerta);
    }

    [Fact]
    public async Task Linha_inexistente_retorna_nao_encontrado()
    {
        await using var db = _banco.CriarContexto();
        var servico = new LinhaService(new SpTransSimuladoClient(TimeProvider.System), new OcorrenciaRepository(db));

        await Assert.ThrowsAsync<RecursoNaoEncontradoException>(() => servico.ObterSituacaoAsync("0000-00"));
    }
}
