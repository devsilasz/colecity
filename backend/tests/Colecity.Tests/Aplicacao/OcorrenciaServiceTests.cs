using Colecity.Application.Dtos;
using Colecity.Application.Services;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Infrastructure.Eventos;
using Colecity.Tests.Suporte;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Tests.Aplicacao;

public sealed class OcorrenciaServiceTests : IDisposable
{
    private readonly CenarioAplicacao _cenario = new();

    public void Dispose() => _cenario.Dispose();

    private static RegistrarOcorrenciaRequest Pedido(Categoria categoria = Categoria.Vias, TipoOcorrencia tipo = TipoOcorrencia.Buraco,
        double lat = -23.5503, double lng = -46.6339) =>
        new(categoria, tipo, "Buraco fundo perto do ponto de ônibus.", new CoordenadaDto(lat, lng), null, null, null);

    private static ConsultaOcorrencias Consulta(
        Categoria[]? categorias = null, EstadoOcorrencia[]? estados = null,
        double? lat = null, double? lng = null, int? raio = null, string? linha = null) =>
        new(categorias, estados, lat, lng, raio, linha, null, null);

    [Fact]
    public async Task Registro_persiste_a_especializacao_com_titulo_e_autor_afetado()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        using var como = _cenario.Como(ana);

        var detalhe = await como.Ocorrencias.RegistrarAsync(Pedido());

        Assert.Equal("Buraco – Sé", detalhe.Titulo);
        Assert.Equal(EstadoOcorrencia.Aberta, detalhe.Estado);
        Assert.True(detalhe.PodeEditar);
        Assert.Equal(new MinhaParticipacaoResponse(true, false, true), detalhe.MinhaParticipacao);

        await using var db = _cenario.NovoContexto();
        var salva = await db.Ocorrencias.Include(o => o.Participacoes).SingleAsync();
        Assert.IsType<OcorrenciaGeral>(salva);
        Assert.Single(salva.Participacoes);
        Assert.Single(await db.EventosLinhaDoTempo.ToListAsync());
    }

    [Fact]
    public async Task Registro_junta_todos_os_campos_obrigatorios_ausentes()
    {
        using var como = _cenario.Como(await _cenario.CadastrarAsync("ana"));

        var erro = await Assert.ThrowsAsync<DomainException>(() =>
            como.Ocorrencias.RegistrarAsync(new RegistrarOcorrenciaRequest(Categoria.Vias, null, null, null, null, null, null)));

        Assert.Equal(CodigosErro.CampoObrigatorio, erro.Codigo);
        Assert.Equal(["tipo", "descricao", "localizacao"], erro.Erros.Keys);
    }

    [Fact]
    public async Task Usuario_nao_cadastrado_recebe_403()
    {
        using var como = _cenario.Como(Fabrica.Usuario("fantasma"));

        var erro = await Assert.ThrowsAsync<AcessoNegadoException>(() => como.Ocorrencias.RegistrarAsync(Pedido()));
        Assert.Equal(CodigosErro.UsuarioNaoCadastrado, erro.Codigo);
    }

    [Fact]
    public async Task Linha_precisa_existir_no_gtfs()
    {
        using var como = _cenario.Como(await _cenario.CadastrarAsync("ana"));
        var pedido = Pedido(Categoria.Transporte, TipoOcorrencia.Superlotacao) with { Linha = "9999-99" };

        var erro = await Assert.ThrowsAsync<DomainException>(() => como.Ocorrencias.RegistrarAsync(pedido));
        Assert.Equal(CodigosErro.LinhaInvalida, erro.Codigo);
    }

    [Fact]
    public async Task Lista_padrao_mostra_nao_concluidas_por_participacao()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var pouco = Fabrica.Ocorrencia(ana, local: Fabrica.Se);
        var muito = Fabrica.Ocorrencia(ana, local: Fabrica.Mooca);
        muito.MarcarParticipacao(bia, TipoParticipacao.Afetado, Fabrica.Agora);
        var concluida = Fabrica.Ocorrencia(ana);
        concluida.Concluir(ana, null, null, Fabrica.Agora);
        await _cenario.SalvarAsync(pouco, muito, concluida);

        using var visitante = _cenario.Como(null);
        var pagina = await visitante.Ocorrencias.ListarAsync(Consulta());

        Assert.Equal(2, pagina.Total);
        Assert.Equal([muito.Id, pouco.Id], pagina.Items.Select(i => i.Id));
        Assert.All(pagina.Items, i => Assert.Null(i.MinhaParticipacao));
    }

    [Fact]
    public async Task Filtro_por_raio_usa_a_distancia_real()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var perto = Fabrica.Ocorrencia(ana, local: new Coordenada(-23.5550, -46.6339));
        var longe = Fabrica.Ocorrencia(ana, local: Fabrica.Mooca);
        await _cenario.SalvarAsync(perto, longe);

        using var visitante = _cenario.Como(null);
        var pagina = await visitante.Ocorrencias.ListarAsync(Consulta(lat: -23.5503, lng: -46.6339, raio: 1));

        Assert.Equal(perto.Id, Assert.Single(pagina.Items).Id);
        await Assert.ThrowsAsync<RequisicaoInvalidaException>(() => visitante.Ocorrencias.ListarAsync(Consulta(lat: -23.55, lng: -46.63, raio: 3)));
        await Assert.ThrowsAsync<RequisicaoInvalidaException>(() => visitante.Ocorrencias.ListarAsync(Consulta(lat: -23.55)));
    }

    [Fact]
    public async Task Ocorrencia_oculta_some_para_todos_menos_o_autor()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var oculta = Fabrica.Ocorrencia(ana);
        oculta.Ocultar();
        await _cenario.SalvarAsync(oculta);

        using var visitante = _cenario.Como(null);
        Assert.Equal(0, (await visitante.Ocorrencias.ListarAsync(Consulta())).Total);
        await Assert.ThrowsAsync<NaoEncontradoException>(() => visitante.Ocorrencias.ObterAsync(oculta.Id));

        using var autora = _cenario.Como(ana);
        Assert.True((await autora.Ocorrencias.ObterAsync(oculta.Id)).Oculta);
    }

    [Fact]
    public async Task Semelhantes_respeitam_tipo_distancia_atividade_e_linha()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var proxima = Fabrica.Ocorrencia(ana, local: new Coordenada(-23.5512, -46.5998));
        var outroTipo = Fabrica.Ocorrencia(ana, Categoria.Agua, TipoOcorrencia.BaixaPressao);
        var distante = Fabrica.Ocorrencia(ana, local: Fabrica.Se);
        var parada = Fabrica.Ocorrencia(ana, em: Fabrica.Agora.AddDays(-8));
        var linha = new LinhaReferencia("8700-10", "Pq. Continental – Pça. Ramos");
        var daLinha = Fabrica.Ocorrencia(ana, Categoria.Transporte, TipoOcorrencia.Superlotacao, new Coordenada(-23.52, -46.73), linha: linha);
        await _cenario.SalvarAsync(proxima, outroTipo, distante, parada, daLinha);

        using var como = _cenario.Como(bia);
        var agua = await como.Ocorrencias.SemelhantesAsync(new SemelhantesRequest(
            Categoria.Agua, TipoOcorrencia.FaltaAbastecimento, new CoordenadaDto(-23.5520, -46.6005), null));
        var transporte = await como.Ocorrencias.SemelhantesAsync(new SemelhantesRequest(
            Categoria.Transporte, TipoOcorrencia.Superlotacao, new CoordenadaDto(-23.5453, -46.6380), "8700-10"));
        var seguranca = await como.Ocorrencias.SemelhantesAsync(new SemelhantesRequest(
            Categoria.Seguranca, TipoOcorrencia.Furto, new CoordenadaDto(-23.5503, -46.6339), null));

        var semelhante = Assert.Single(agua);
        Assert.Equal(proxima.Id, semelhante.Id);
        Assert.InRange(semelhante.DistanciaMetros, 100, 130);
        Assert.Equal(daLinha.Id, Assert.Single(transporte).Id);
        Assert.Empty(seguranca);
    }

    [Fact]
    public async Task Participacao_concluir_e_reabrir_de_ponta_a_ponta()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        await _cenario.SalvarAsync(ocorrencia);

        using (var como = _cenario.Como(bia))
        {
            var resposta = await como.Participacoes.MarcarAsync(ocorrencia.Id, TipoParticipacao.Afetado);
            Assert.Equal(2, resposta.TotalAfetados);
            Assert.Null(await como.Participacoes.RetirarAsync(ocorrencia.Id, TipoParticipacao.Apoio));
        }

        using (var como = _cenario.Como(ana))
            await como.Ocorrencias.ConcluirAsync(ocorrencia.Id, new ConcluirOcorrenciaRequest("Resolvido pela Sabesp.", null));

        using (var como = _cenario.Como(bia))
        {
            var detalhe = await como.Ocorrencias.ObterAsync(ocorrencia.Id);
            Assert.True(detalhe.PodeReabrir);
            var reaberta = await como.Ocorrencias.ReabrirAsync(ocorrencia.Id);
            Assert.Equal(EstadoOcorrencia.EmAcompanhamento, reaberta.Estado);
        }

        using var visitante = _cenario.Como(null);
        var linhaDoTempo = await visitante.Ocorrencias.LinhaDoTempoAsync(ocorrencia.Id);
        Assert.Equal(
            [TipoEventoLinhaDoTempo.Criada, TipoEventoLinhaDoTempo.Concluida, TipoEventoLinhaDoTempo.Reaberta],
            linhaDoTempo.Select(e => e.Tipo));
    }

    [Fact]
    public async Task Mudanca_de_estado_e_gravada_no_outbox_na_mesma_transacao()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        await _cenario.SalvarAsync(ocorrencia);

        using (var como = _cenario.Como(ana))
            await como.Ocorrencias.ConcluirAsync(ocorrencia.Id, new ConcluirOcorrenciaRequest(null, null));

        await using var db = _cenario.NovoContexto();
        var mensagem = Assert.Single(await db.Set<MensagemOutbox>().ToListAsync());
        Assert.Equal("ocorrencia.estado_alterado", mensagem.Tipo);
        Assert.Contains("\"novoEstado\":\"CONCLUIDA\"", mensagem.Payload);
    }

    [Fact]
    public async Task Comentarios_mostram_selo_de_afetado_em_ordem_cronologica()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        await _cenario.SalvarAsync(ocorrencia);

        using (var como = _cenario.Como(bia))
            await como.Comentarios.ComentarAsync(ocorrencia.Id, new ComentarRequest("Primeiro!", null));
        _cenario.Relogio.Agora = Fabrica.Agora.AddMinutes(5);
        using (var como = _cenario.Como(ana))
            await como.Comentarios.ComentarAsync(ocorrencia.Id, new ComentarRequest("Segundo.", null));

        using var leitura = _cenario.Como(bia);
        var pagina = await leitura.Comentarios.ListarAsync(ocorrencia.Id, null, null);

        Assert.Equal(["Primeiro!", "Segundo."], pagina.Items.Select(c => c.Texto));
        Assert.Equal([false, true], pagina.Items.Select(c => c.Autor.Afetado));
        Assert.Equal([true, false], pagina.Items.Select(c => c.PodeExcluir));
    }

    [Fact]
    public async Task Minhas_ocorrencias_por_aba_com_concluidas_por_ultimo()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var concluida = Fabrica.Ocorrencia(ana, em: Fabrica.Agora.AddDays(-1));
        concluida.Concluir(ana, null, null, Fabrica.Agora);
        var aberta = Fabrica.Ocorrencia(ana, em: Fabrica.Agora.AddDays(-2));
        var deOutra = Fabrica.Ocorrencia(bia);
        await _cenario.SalvarAsync(concluida, aberta, deOutra);
        using (var como = _cenario.Como(ana))
            await como.Participacoes.MarcarAsync(deOutra.Id, TipoParticipacao.Apoio);

        using var minhas = _cenario.Como(ana);
        var registradas = await minhas.Usuarios.MinhasOcorrenciasAsync(AbaMinhas.Registradas, null, null);
        var afetado = await minhas.Usuarios.MinhasOcorrenciasAsync(AbaMinhas.Afetado, null, null);
        var apoio = await minhas.Usuarios.MinhasOcorrenciasAsync(AbaMinhas.Apoio, null, null);

        Assert.Equal([aberta.Id, concluida.Id], registradas.Items.Select(i => i.Id));
        Assert.Equal(2, afetado.Total);
        Assert.Equal(deOutra.Id, Assert.Single(apoio.Items).Id);
    }

    [Fact]
    public async Task Exclusao_de_conta_anonimiza_e_recalcula_contagens()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var bia = await _cenario.CadastrarAsync("bia");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        await _cenario.SalvarAsync(ocorrencia);
        using (var como = _cenario.Como(bia))
        {
            await como.Participacoes.MarcarAsync(ocorrencia.Id, TipoParticipacao.Afetado);
            await como.Comentarios.ComentarAsync(ocorrencia.Id, new ComentarRequest("Aqui também.", null));
            await como.Usuarios.ExcluirContaAsync();
        }

        using var visitante = _cenario.Como(null);
        var detalhe = await visitante.Ocorrencias.ObterAsync(ocorrencia.Id);
        var comentario = Assert.Single((await visitante.Comentarios.ListarAsync(ocorrencia.Id, null, null)).Items);
        Assert.Equal(1, detalhe.TotalAfetados);
        Assert.Equal(new AutorComentarioResponse("Usuário removido", false, true), comentario.Autor);

        using var removida = _cenario.Como(bia);
        await Assert.ThrowsAsync<AcessoNegadoException>(() => removida.Usuarios.ObterAsync());
    }

    [Fact]
    public async Task Cinco_denuncias_ocultam_e_a_moderacao_pode_reexibir()
    {
        var ana = await _cenario.CadastrarAsync("ana");
        var ocorrencia = Fabrica.Ocorrencia(ana);
        await _cenario.SalvarAsync(ocorrencia);
        var pedido = new DenunciaRequest(TipoConteudo.Ocorrencia, ocorrencia.Id, MotivoDenuncia.Falso);

        for (var i = 0; i < 5; i++)
        {
            using var como = _cenario.Como(await _cenario.CadastrarAsync($"denunciante{i}"));
            await como.Moderacao.DenunciarAsync(pedido);
            if (i == 0)
                await Assert.ThrowsAsync<ConflitoException>(() => como.Moderacao.DenunciarAsync(pedido));
        }

        using (var visitante = _cenario.Como(null))
            await Assert.ThrowsAsync<NaoEncontradoException>(() => visitante.Ocorrencias.ObterAsync(ocorrencia.Id));

        using (var admin = _cenario.Como(null))
        {
            var pendente = Assert.Single(await admin.Moderacao.ListarPendentesAsync());
            Assert.Equal((5, true), (pendente.TotalContas, pendente.Oculto));
            await admin.Moderacao.DecidirAsync(ocorrencia.Id, new DecisaoModeracaoRequest(AcaoModeracao.Manter));
        }

        using var depois = _cenario.Como(null);
        Assert.Equal(ocorrencia.Id, (await depois.Ocorrencias.ObterAsync(ocorrencia.Id)).Id);
    }
}
