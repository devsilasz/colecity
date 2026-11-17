using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;
using Colecity.Domain.Servicos;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Dominio;

public class ViagemTests
{
    private static readonly DateTime Agora = Fabrica.Agora;
    private static readonly Coordenada Ponto = new(-23.52, -46.70);
    private readonly Viagem _viagem = new(Guid.NewGuid(), "8700-10", 1, Agora);

    private ResultadoPosicao Posicao(int minuto, double distancia, Coordenada? ponto = null) =>
        _viagem.RegistrarPosicao(ponto ?? Ponto, Agora.AddMinutes(minuto), distancia, Agora.AddMinutes(minuto));

    [Fact]
    public void Tres_posicoes_seguidas_a_mais_de_300m_geram_suspeita_de_desvio()
    {
        Assert.False(Posicao(1, 50).DesvioSuspeito);
        Assert.False(Posicao(2, 400).DesvioSuspeito);
        Assert.False(Posicao(3, 450).DesvioSuspeito);

        var resultado = Posicao(4, 500);

        Assert.True(resultado.Ativa);
        Assert.True(resultado.DesvioSuspeito);
        Assert.Equal(3, resultado.TrechoDesvio!.Count);
    }

    [Fact]
    public void Volta_ao_trajeto_zera_a_sequencia()
    {
        Posicao(1, 400);
        Posicao(2, 400);
        Posicao(3, 100);

        Assert.False(Posicao(4, 400).DesvioSuspeito);
    }

    [Fact]
    public void Resposta_ao_desvio_so_vale_uma_vez()
    {
        Posicao(1, 400);
        Posicao(2, 400);
        Posicao(3, 400);

        Assert.NotNull(_viagem.ResponderDesvio(confirmado: true));
        var erro = Assert.Throws<DomainException>(() => _viagem.ResponderDesvio(true));
        Assert.Equal(CodigosErro.DesvioNaoDetectado, erro.Codigo);

        // Posições já avaliadas não geram nova pergunta; só 3 novas fora do trajeto.
        Assert.False(Posicao(4, 400).DesvioSuspeito);
        Posicao(5, 400);
        Assert.True(Posicao(6, 400).DesvioSuspeito);
    }

    [Fact]
    public void Desvio_negado_nao_devolve_trecho()
    {
        Posicao(1, 400);
        Posicao(2, 400);
        Posicao(3, 400);

        Assert.Null(_viagem.ResponderDesvio(confirmado: false));
    }

    [Fact]
    public void Dez_minutos_parado_fora_do_trajeto_encerra_a_viagem()
    {
        for (var minuto = 0; minuto < 10; minuto++)
            Assert.True(Posicao(minuto, 400).Ativa);

        var resultado = Posicao(10, 400);

        Assert.False(resultado.Ativa);
        Assert.Equal(MotivoEncerramentoViagem.ParadaForaDoTrajeto, _viagem.MotivoEncerramento);
    }

    [Fact]
    public void Viagem_expira_em_2_horas()
    {
        var resultado = _viagem.RegistrarPosicao(Ponto, Agora.AddHours(2), 0, Agora.AddHours(2));

        Assert.False(resultado.Ativa);
        Assert.Equal(MotivoEncerramentoViagem.Expirada, _viagem.MotivoEncerramento);
    }
}

public class ServicosDeDominioTests
{
    private static RelatoGeolocalizado Relato(Guid autor, double dLat = 0) =>
        new(Categoria.Seguranca, new Coordenada(-23.5503 + dLat, -46.6339), autor);

    [Fact]
    public void Cinco_contas_distintas_em_300m_formam_zona_de_atencao()
    {
        var relatos = Enumerable.Range(0, 5).Select(i => Relato(Guid.NewGuid(), i * 0.0005)).ToList();

        var zona = Assert.Single(CalculadoraZonasAtencao.Calcular(relatos, Fabrica.Agora));

        Assert.Equal(Categoria.Seguranca, zona.Categoria);
        Assert.Equal(5, zona.TotalRelatos);
        Assert.Equal("5 relatos da comunidade nos últimos 30 dias", zona.Texto);
    }

    [Fact]
    public void Relatos_da_mesma_conta_ou_distantes_nao_formam_zona()
    {
        var mesmaConta = Guid.NewGuid();
        var repetidos = Enumerable.Range(0, 6).Select(_ => Relato(mesmaConta)).ToList();
        var distantes = Enumerable.Range(0, 5).Select(i => Relato(Guid.NewGuid(), i * 0.01)).ToList();
        var quatro = Enumerable.Range(0, 4).Select(_ => Relato(Guid.NewGuid())).ToList();

        Assert.Empty(CalculadoraZonasAtencao.Calcular(repetidos, Fabrica.Agora));
        Assert.Empty(CalculadoraZonasAtencao.Calcular(distantes, Fabrica.Agora));
        Assert.Empty(CalculadoraZonasAtencao.Calcular(quatro, Fabrica.Agora));
    }

    [Fact]
    public void Passageiros_proximos_viram_um_unico_onibus()
    {
        var agora = Fabrica.Agora;
        var posicoes = new List<PosicaoPassageiro>
        {
            new(new Coordenada(-23.5200, -46.7000), agora),
            new(new Coordenada(-23.5205, -46.7005), agora.AddSeconds(-30)),
            new(new Coordenada(-23.5400, -46.6500), agora)
        };

        var onibus = AgregadorPosicoesPassageiros.Agregar(posicoes);

        Assert.Equal(2, onibus.Count);
        Assert.Contains(onibus, o => Math.Abs(o.Posicao.Lat - -23.52025) < 1e-9);
    }
}
