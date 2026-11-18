using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Eventos;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Dominio;

public class OcorrenciaTests
{
    private readonly Usuario _autor = Fabrica.Usuario("autor");
    private readonly Usuario _vizinho = Fabrica.Usuario("vizinho");
    private static readonly DateTime Agora = Fabrica.Agora;

    private static T Erro<T>(Action acao, string codigo) where T : DomainException
    {
        var erro = Assert.Throws<T>(acao);
        Assert.Equal(codigo, erro.Codigo);
        return erro;
    }

    // ---- Registro (RN-REG) ----

    [Fact]
    public void Registro_comeca_aberto_com_o_autor_afetado_e_evento_criada()
    {
        var o = Fabrica.Ocorrencia(_autor);

        Assert.Equal(EstadoOcorrencia.Aberta, o.Estado);
        Assert.Equal(1, o.TotalAfetados);
        Assert.True(o.Participa(_autor.Id, TipoParticipacao.Afetado));
        Assert.Equal(TipoEventoLinhaDoTempo.Criada, Assert.Single(o.Eventos).Tipo);
        Assert.Equal("Falta de abastecimento – Rua Taquari, Mooca", o.Titulo);
    }

    [Fact]
    public void Sem_geocodificacao_o_titulo_fica_provisorio()
    {
        var o = FabricaOcorrencias.Registrar(new NovaOcorrencia(Categoria.Vias, TipoOcorrencia.Buraco,
            "Buraco grande na esquina.", Fabrica.Se, null, _autor, [], Agora));

        Assert.Equal("Buraco – Localização aproximada", o.Titulo);
        Assert.True(o.EnderecoPendente);

        o.DefinirEndereco(new Endereco(null, "Sé"));
        Assert.Equal("Buraco – Sé", o.Titulo);
        Assert.False(o.EnderecoPendente);
    }

    [Theory]
    [InlineData(Categoria.Transporte, typeof(OcorrenciaTransporte))]
    [InlineData(Categoria.Seguranca, typeof(OcorrenciaSeguranca))]
    [InlineData(Categoria.Agua, typeof(OcorrenciaServicoEssencial))]
    [InlineData(Categoria.Energia, typeof(OcorrenciaServicoEssencial))]
    [InlineData(Categoria.Vias, typeof(OcorrenciaGeral))]
    public void Fabrica_escolhe_a_especializacao_da_categoria(Categoria categoria, Type esperado)
    {
        var tipo = CatalogoTipo(categoria);
        Assert.IsType(esperado, Fabrica.Ocorrencia(_autor, categoria, tipo));
    }

    [Fact]
    public void Tipo_de_outra_categoria_e_rejeitado() =>
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, Categoria.Vias, TipoOcorrencia.Furto), CodigosErro.TipoInvalidoParaCategoria);

    [Fact]
    public void Localizacao_fora_de_Sao_Paulo_e_rejeitada() =>
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, local: new Coordenada(-23.4538, -46.5333)), CodigosErro.LocalizacaoForaDoMunicipio);

    [Theory]
    [InlineData("curta")]
    [InlineData("")]
    public void Descricao_precisa_ter_de_10_a_500_caracteres(string descricao) =>
        Erro<DomainException>(() => FabricaOcorrencias.Registrar(new NovaOcorrencia(Categoria.Vias, TipoOcorrencia.Buraco,
            descricao, Fabrica.Se, null, _autor, [], Agora)), CodigosErro.DescricaoTamanhoInvalido);

    [Fact]
    public void Aceita_ate_3_fotos_webp_da_pasta_do_proprio_usuario()
    {
        var o = Fabrica.Ocorrencia(_autor, fotos: ["ocorrencias/uid-autor/1.webp", "ocorrencias/uid-autor/2.webp"]);
        Assert.Equal(2, o.Fotos.Count);

        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, fotos: ["a", "b", "c", "d"]), CodigosErro.LimiteFotosExcedido);
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, fotos: ["ocorrencias/uid-autor/1.png"]), CodigosErro.FotoInvalida);
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, fotos: ["ocorrencias/uid-outro/1.webp"]), CodigosErro.FotoInvalida);
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, fotos: ["ocorrencias/uid-autor/../x/1.webp"]), CodigosErro.FotoInvalida);
    }

    [Fact]
    public void Linha_so_em_transporte() =>
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, linha: new LinhaReferencia("8700-10", "Linha")), CodigosErro.LinhaInvalida);

    [Fact]
    public void Data_do_ocorrido_so_em_seguranca_e_dentro_de_30_dias()
    {
        Erro<DomainException>(() => Fabrica.Ocorrencia(_autor, dataHoraOcorrido: Agora.AddDays(-1)), CodigosErro.DataOcorridoInvalida);
        Erro<DomainException>(() => Seguranca(Agora.AddDays(1)), CodigosErro.DataOcorridoInvalida);
        Erro<DomainException>(() => Seguranca(Agora.AddDays(-31)), CodigosErro.DataOcorridoInvalida);

        Assert.Equal(Agora.AddDays(-3), ((OcorrenciaSeguranca)Seguranca(Agora.AddDays(-3))).DataHoraOcorrido);
        Assert.Equal(Agora, ((OcorrenciaSeguranca)Seguranca(null)).DataHoraOcorrido);
    }

    // ---- Participação (RN-PAR) e estados (RN-ACO) ----

    [Fact]
    public void Tres_afetados_levam_a_em_acompanhamento_e_publicam_evento()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        Assert.Equal(EstadoOcorrencia.Aberta, o.Estado);

        o.MarcarParticipacao(Fabrica.Usuario("terceiro"), TipoParticipacao.Afetado, Agora);

        Assert.Equal(EstadoOcorrencia.EmAcompanhamento, o.Estado);
        Assert.Contains(o.Eventos, e => e.Tipo == TipoEventoLinhaDoTempo.EstadoAlterado);
        var evento = Assert.IsType<EstadoAlteradoEvento>(Assert.Single(o.EventosDominio));
        Assert.Equal(EstadoOcorrencia.EmAcompanhamento, evento.NovoEstado);
    }

    [Fact]
    public void Seguranca_nao_tem_ciclo_de_acompanhamento()
    {
        var o = Seguranca(null);
        Fabrica.Afetar(o, 5);

        Assert.Equal(EstadoOcorrencia.Aberta, o.Estado);
    }

    [Fact]
    public void Marco_de_10_afetados_entra_uma_vez_na_linha_do_tempo()
    {
        var o = Fabrica.Ocorrencia(_autor);
        Fabrica.Afetar(o, 8);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.RetirarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);

        var marco = Assert.Single(o.Eventos, e => e.Tipo == TipoEventoLinhaDoTempo.MarcoAfetados);
        Assert.Equal("10 pessoas afetadas", marco.Descricao);
    }

    [Fact]
    public void Participacao_e_idempotente_e_tem_contagens_separadas()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Apoio, Agora);

        Assert.Equal((2, 1), (o.TotalAfetados, o.TotalApoios));
        Assert.True(o.RetirarParticipacao(_vizinho, TipoParticipacao.Apoio, Agora));
        Assert.False(o.RetirarParticipacao(_vizinho, TipoParticipacao.Apoio, Agora));
        Assert.Equal(0, o.TotalApoios);
    }

    [Fact]
    public void Autor_nao_apoia_nem_deixa_de_ser_afetado()
    {
        var o = Fabrica.Ocorrencia(_autor);

        Erro<DomainException>(() => o.MarcarParticipacao(_autor, TipoParticipacao.Apoio, Agora), CodigosErro.AutorNaoPodeApoiar);
        Erro<DomainException>(() => o.RetirarParticipacao(_autor, TipoParticipacao.Afetado, Agora), CodigosErro.AutorSempreAfetado);
    }

    [Fact]
    public void Concluida_nao_aceita_participacao_nem_comentario()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.Concluir(_autor, null, null, Agora);

        Erro<ConflitoException>(() => o.MarcarParticipacao(_vizinho, TipoParticipacao.Apoio, Agora), CodigosErro.OcorrenciaConcluida);
        Erro<ConflitoException>(() => o.Comentar(_vizinho, "Oi", null, Agora), CodigosErro.OcorrenciaConcluida);
    }

    [Fact]
    public void Somente_o_autor_conclui_com_feedback_opcional()
    {
        var o = Fabrica.Ocorrencia(_autor);

        Erro<AcessoNegadoException>(() => o.Concluir(_vizinho, null, null, Agora), CodigosErro.SomenteAutor);
        Erro<DomainException>(() => o.Concluir(_autor, new string('x', 501), null, Agora), CodigosErro.FeedbackTamanhoInvalido);

        o.Concluir(_autor, "A prefeitura tapou o buraco.", ["ocorrencias/uid-autor/depois.webp"], Agora);

        Assert.Equal(EstadoOcorrencia.Concluida, o.Estado);
        Assert.Equal(MotivoConclusao.Autor, o.MotivoConclusao);
        Assert.Single(o.FotosConclusao);
        Erro<ConflitoException>(() => o.Concluir(_autor, null, null, Agora), CodigosErro.OcorrenciaConcluida);
    }

    [Fact]
    public void Afetado_reabre_em_ate_7_dias()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.Concluir(_autor, "Resolvido", null, Agora);

        Assert.True(o.PodeReabrir(_vizinho.Id, Agora.AddDays(7)));
        Erro<AcessoNegadoException>(() => o.Reabrir(Fabrica.Usuario("estranho"), Agora), CodigosErro.SomenteAfetado);
        Erro<DomainException>(() => o.Reabrir(_vizinho, Agora.AddDays(8)), CodigosErro.PrazoReaberturaExpirado);

        o.Reabrir(_vizinho, Agora.AddDays(2));

        Assert.Equal(EstadoOcorrencia.EmAcompanhamento, o.Estado);
        Assert.Null(o.ConcluidaEm);
        Assert.Null(o.FeedbackConclusao);
        Assert.Equal(TipoEventoLinhaDoTempo.Reaberta, o.Eventos.Last().Tipo);
    }

    [Fact]
    public void Seguranca_nao_pode_ser_reaberta()
    {
        var o = Seguranca(null);
        o.Concluir(_autor, null, null, Agora);

        Erro<DomainException>(() => o.Reabrir(_autor, Agora), CodigosErro.ReaberturaNaoPermitida);
    }

    [Theory]
    [InlineData(Categoria.Agua, 6, false)]
    [InlineData(Categoria.Agua, 7, true)]
    [InlineData(Categoria.Energia, 7, true)]
    [InlineData(Categoria.Vias, 29, false)]
    [InlineData(Categoria.Vias, 30, true)]
    public void Encerramento_por_inatividade_depende_da_categoria(Categoria categoria, int diasSemAtividade, bool encerra)
    {
        var o = Fabrica.Ocorrencia(_autor, categoria, CatalogoTipo(categoria));

        Assert.Equal(encerra, o.EncerrarSeVencida(Agora.AddDays(diasSemAtividade)));
        Assert.Equal(encerra ? MotivoConclusao.Inatividade : null, o.MotivoConclusao);
    }

    [Fact]
    public void Atividade_recente_adia_o_encerramento()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.Comentar(_vizinho, "Ainda sem água.", null, Agora.AddDays(5));

        Assert.False(o.EncerrarSeVencida(Agora.AddDays(8)));
        Assert.True(o.EncerrarSeVencida(Agora.AddDays(12)));
    }

    [Fact]
    public void Seguranca_conclui_30_dias_apos_o_relato_mesmo_com_atividade()
    {
        var o = Seguranca(null);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora.AddDays(29));

        Assert.True(o.EncerrarSeVencida(Agora.AddDays(30)));
    }

    // ---- Edição, comentários e política por categoria ----

    [Fact]
    public void Somente_o_autor_edita_descricao_e_fotos()
    {
        var o = Fabrica.Ocorrencia(_autor, fotos: ["ocorrencias/uid-autor/1.webp"]);

        Erro<AcessoNegadoException>(() => o.Editar(_vizinho, "Nova descrição longa", null), CodigosErro.SomenteAutor);
        o.Editar(_autor, "Nova descrição longa", ["ocorrencias/uid-autor/2.webp", "ocorrencias/uid-autor/3.webp"]);

        Assert.Equal("Nova descrição longa", o.Descricao);
        Assert.Equal(["ocorrencias/uid-autor/2.webp", "ocorrencias/uid-autor/3.webp"], o.Fotos.Select(f => f.Path));
    }

    [Fact]
    public void Comentario_valida_tamanho_e_publica_evento()
    {
        var o = Fabrica.Ocorrencia(_autor);

        Erro<DomainException>(() => o.Comentar(_vizinho, "  ", null, Agora), CodigosErro.ComentarioTamanhoInvalido);
        var comentario = o.Comentar(_vizinho, "Aqui também!", null, Agora);

        Assert.Equal("Aqui também!", comentario.Texto);
        Assert.IsType<ComentarioCriadoEvento>(Assert.Single(o.EventosDominio));
        Erro<AcessoNegadoException>(() => comentario.GarantirQuePodeSerExcluidoPor(_autor.Id), CodigosErro.SomenteAutor);
    }

    [Fact]
    public void Politica_por_categoria_e_polimorfica()
    {
        var seguranca = Seguranca(null);
        var riscos = Fabrica.Ocorrencia(_autor, Categoria.RiscosInfraestrutura, TipoOcorrencia.RiscoDeslizamento);
        var vias = Fabrica.Ocorrencia(_autor, Categoria.Vias, TipoOcorrencia.Buraco);

        Assert.False(seguranca.ExibeApoiadores);
        Assert.False(seguranca.SugereSemelhantes);
        Assert.True(seguranca.ContaParaZonaDeAtencao);
        Assert.True(riscos.ContaParaZonaDeAtencao);
        Assert.False(vias.ContaParaZonaDeAtencao);
        Assert.True(vias.ExibeApoiadores);
    }

    [Fact]
    public void Anonimizacao_remove_participacoes_das_contagens()
    {
        var o = Fabrica.Ocorrencia(_autor);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Afetado, Agora);
        o.MarcarParticipacao(_vizinho, TipoParticipacao.Apoio, Agora);

        o.RemoverParticipacoesDe(_vizinho.Id);
        o.RemoverParticipacoesDe(_autor.Id);

        Assert.Equal((0, 0), (o.TotalAfetados, o.TotalApoios));
    }

    [Fact]
    public void Desvio_confirmado_reforca_a_ocorrencia_de_transporte()
    {
        var o = (OcorrenciaTransporte)Fabrica.Ocorrencia(_autor, Categoria.Transporte, TipoOcorrencia.AlteracaoRotaSemAviso,
            linha: new LinhaReferencia("8700-10", "Pq. Continental – Pça. Ramos"));
        var trecho = new List<Coordenada> { new(-23.51, -46.70), new(-23.51, -46.71) };

        o.RegistrarDesvio(_vizinho, trecho, Agora);

        Assert.True(o.Participa(_vizinho.Id, TipoParticipacao.Afetado));
        Assert.Equal(trecho, Assert.Single(o.Eventos, e => e.Tipo == TipoEventoLinhaDoTempo.DesvioDetectado).Trecho);
        Assert.Equal("8700-10", Assert.IsType<DesvioConfirmadoEvento>(o.EventosDominio.Last()).Linha);
    }

    private Ocorrencia Seguranca(DateTime? ocorrido) =>
        Fabrica.Ocorrencia(_autor, Categoria.Seguranca, TipoOcorrencia.Furto, Fabrica.Se, dataHoraOcorrido: ocorrido);

    private static TipoOcorrencia CatalogoTipo(Categoria categoria) =>
        Domain.CatalogoCategorias.Todas.Single(c => c.Categoria == categoria).Tipos[0].Tipo;
}
