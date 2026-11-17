using System.Text.Json.Nodes;
using Colecity.Application.Tarefas;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
using Colecity.Infrastructure.Consultas;
using Colecity.Infrastructure.Eventos;
using Colecity.Infrastructure.Repositories;
using Colecity.Infrastructure.Transporte;
using Colecity.Tests.Suporte;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;

namespace Colecity.Tests.Aplicacao;

public sealed class TarefasEConsultasTests : IDisposable
{
    private readonly CenarioAplicacao _cenario = new();

    public void Dispose() => _cenario.Dispose();

    [Fact]
    public async Task Tarefa_de_encerramento_conclui_somente_as_vencidas()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var aguaParada = Fabrica.Ocorrencia(ana, em: Fabrica.Agora.AddDays(-8));
        var viasParada = Fabrica.Ocorrencia(ana, Categoria.Vias, TipoOcorrencia.Buraco, em: Fabrica.Agora.AddDays(-8));
        await _cenario.SalvarAsync(aguaParada, viasParada);

        await using (var db = _cenario.NovoContexto())
            await new EncerramentoAutomaticoTarefa(new OcorrenciaRepository(db), db, _cenario.Relogio,
                NullLogger<EncerramentoAutomaticoTarefa>.Instance).ExecutarAsync(CancellationToken.None);

        await using var leitura = _cenario.NovoContexto();
        var estados = await leitura.Ocorrencias.ToDictionaryAsync(o => o.Id, o => (o.Estado, o.MotivoConclusao));
        Assert.Equal((EstadoOcorrencia.Concluida, MotivoConclusao.Inatividade), estados[aguaParada.Id]);
        Assert.Equal((EstadoOcorrencia.Aberta, (MotivoConclusao?)null), estados[viasParada.Id]);
    }

    [Fact]
    public async Task Tarefa_de_zonas_gera_zona_e_marca_as_ocorrencias()
    {
        var relatos = new List<Domain.Entities.Ocorrencia>();
        for (var i = 0; i < 5; i++)
        {
            var autor = await _cenario.CadastrarAsync($"pessoa{i}");
            relatos.Add(Fabrica.Ocorrencia(autor, Categoria.Seguranca, TipoOcorrencia.LocalMalIluminadoErmo,
                new Coordenada(-23.5503 + i * 0.0004, -46.6339)));
        }
        await _cenario.SalvarAsync([.. relatos]);

        await using (var db = _cenario.NovoContexto())
            await new ZonasAtencaoTarefa(new MapaConsultas(db), new ZonaAtencaoRepository(db), db, _cenario.Relogio)
                .ExecutarAsync(CancellationToken.None);

        await using var leitura = _cenario.NovoContexto();
        var area = new CaixaDelimitadora(-24, -47, -23, -46);
        var zona = Assert.Single(await new MapaConsultas(leitura).ZonasAsync(area));
        Assert.Equal(5, zona.TotalRelatos);

        using var visitante = _cenario.Como(null);
        var lista = await visitante.Ocorrencias.ListarAsync(new(null, null, null, null, null, null, null, null));
        Assert.All(lista.Items, o => Assert.True(o.ZonaAtencao));
    }

    [Fact]
    public async Task Mapa_de_calor_conta_afetados_distintos_por_celula()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var a = Fabrica.Ocorrencia(ana, local: new Coordenada(-23.5500, -46.6340));
        var b = Fabrica.Ocorrencia(ana, Categoria.Vias, TipoOcorrencia.Buraco, new Coordenada(-23.5502, -46.6341));
        b.MarcarParticipacao(bia, TipoParticipacao.Afetado, Fabrica.Agora);
        await _cenario.SalvarAsync(a, b);

        await using var db = _cenario.NovoContexto();
        var celulas = await new MapaConsultas(db).CalorAsync(new CaixaDelimitadora(-24, -47, -23, -46), categoria: null);
        var soAgua = await new MapaConsultas(db).CalorAsync(new CaixaDelimitadora(-24, -47, -23, -46), Categoria.Agua);

        // Ana afeta as duas ocorrências da mesma célula, mas conta uma vez.
        Assert.Equal(2, Assert.Single(celulas).Peso);
        Assert.Equal(1, Assert.Single(soAgua).Peso);
    }

    [Fact]
    public async Task Publicador_envia_ao_bff_sem_quem_causou_o_evento_e_desiste_apos_3_falhas()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        ocorrencia.MarcarParticipacao(bia, TipoParticipacao.Apoio, Fabrica.Agora);
        ocorrencia.LimparEventosDominio();
        await _cenario.SalvarAsync(ocorrencia);
        using (var como = _cenario.Como(bia))
            await como.Comentarios.ComentarAsync(ocorrencia.Id, new("Ainda sem água.", null));

        var bff = new BffFalso { Responde = true };
        await PublicarAsync(bff);

        var envelope = Assert.Single(bff.Recebidos);
        Assert.Equal("ocorrencia.comentario_criado", envelope.Tipo);
        Assert.Equal("uid-bia", envelope.Dados["autorAcaoUid"]!.GetValue<string>());
        Assert.Equal(["uid-ana"], envelope.Dados["destinatariosUids"]!.AsArray().Select(n => n!.GetValue<string>()));

        // Nova mensagem com o BFF fora do ar: 3 tentativas com intervalo crescente e depois desiste.
        using (var como = _cenario.Como(ana))
            await como.Comentarios.ComentarAsync(ocorrencia.Id, new("Sabesp avisou que volta amanhã.", null));
        bff.Responde = false;
        foreach (var minutos in new[] { 0, 1, 5 })
        {
            _cenario.Relogio.Agora = Fabrica.Agora.AddMinutes(minutos);
            await PublicarAsync(bff);
        }

        await using var db = _cenario.NovoContexto();
        var falha = await db.Outbox.SingleAsync(m => m.ProcessadaEm == null);
        Assert.Equal((3, true), (falha.Tentativas, falha.Falhou));
    }

    [Fact]
    public async Task Gtfs_e_lido_importado_e_consultado()
    {
        var dados = GtfsLeitor.Ler(GtfsLeitor.DiretorioPadrao);
        Assert.Equal(4, dados.Linhas.Count);
        Assert.All(dados.Linhas, l => Assert.Equal([1, 2], l.Sentidos.Select(s => s.Sentido).Order()));

        await using (var db = _cenario.NovoContexto())
            await new GtfsImportador(db, new LinhaRepository(db), Options.Create(new GtfsOptions()), NullLogger<GtfsImportador>.Instance)
                .ImportarAsync();

        await using var leitura = _cenario.NovoContexto();
        var linhas = new LinhaRepository(leitura);
        var encontrada = Assert.Single(await linhas.BuscarAsync("Continental", 10));
        Assert.Equal("8700-10", encontrada.Codigo);
        var trajeto = await linhas.ObterTrajetoAsync("8700-10", 1);
        Assert.Equal(11, trajeto.Count);
        Assert.Equal(Enumerable.Range(1, 11), trajeto.Select(p => p.Sequencia));
    }

    private async Task PublicarAsync(IEnvioEventosBff bff)
    {
        await using var db = _cenario.NovoContexto();
        await new PublicadorEventosTarefa(db, bff, _cenario.Relogio).ExecutarAsync(CancellationToken.None);
    }

    private sealed class BffFalso : IEnvioEventosBff
    {
        public bool Responde { get; set; }
        public List<EnvelopeEvento> Recebidos { get; } = [];

        public Task<bool> EnviarAsync(EnvelopeEvento envelope, CancellationToken ct)
        {
            if (Responde)
                Recebidos.Add(envelope);
            return Task.FromResult(Responde);
        }
    }
}
