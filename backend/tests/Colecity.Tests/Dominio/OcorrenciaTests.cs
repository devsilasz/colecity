using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Tests.Suporte;

namespace Colecity.Tests.Dominio;

public class OcorrenciaTests
{
    private readonly Guid _autor = Guid.NewGuid();

    [Fact]
    public void Autor_e_o_primeiro_apoiador()
    {
        var ocorrencia = Fabrica.Via(_autor);

        Assert.Equal(1, ocorrencia.TotalApoios);
        Assert.True(ocorrencia.FoiApoiadaPor(_autor));
        Assert.Equal(StatusOcorrencia.Aberta, ocorrencia.Status);
    }

    [Fact]
    public void Usuario_nao_pode_apoiar_duas_vezes()
    {
        var ocorrencia = Fabrica.Via(_autor);

        var erro = Assert.Throws<DomainException>(() => ocorrencia.Apoiar(_autor));
        Assert.Contains("já apoia", erro.Message);
    }

    [Fact]
    public void Vira_abaixo_assinado_ao_atingir_minimo_do_modulo()
    {
        var ocorrencia = Fabrica.Via(_autor);

        ocorrencia.Apoiar(Guid.NewGuid());
        Assert.Equal(StatusOcorrencia.Aberta, ocorrencia.Status);

        ocorrencia.Apoiar(Guid.NewGuid());
        Assert.Equal(ocorrencia.ApoiosParaAbaixoAssinado, ocorrencia.TotalApoios);
        Assert.Equal(StatusOcorrencia.AbaixoAssinado, ocorrencia.Status);
    }

    [Theory]
    [InlineData(Modulo.Transporte, 10)]
    [InlineData(Modulo.Agua, 5)]
    [InlineData(Modulo.Vias, 3)]
    public void Cada_modulo_define_seu_minimo_de_apoios(Modulo modulo, int esperado)
    {
        Ocorrencia ocorrencia = modulo switch
        {
            Modulo.Transporte => Fabrica.Transporte(_autor),
            Modulo.Agua => Fabrica.Agua(_autor),
            _ => Fabrica.Via(_autor)
        };

        Assert.Equal(modulo, ocorrencia.Modulo);
        Assert.Equal(esperado, ocorrencia.ApoiosParaAbaixoAssinado);
    }

    [Fact]
    public void Prioridade_considera_peso_de_urgencia_do_modulo()
    {
        var agua = Fabrica.Agua(_autor);
        var via = Fabrica.Via(_autor);

        Assert.True(agua.CalcularPrioridade() > via.CalcularPrioridade());
    }

    [Fact]
    public void Somente_apoiador_confirma_resolucao()
    {
        var ocorrencia = Fabrica.Via(_autor);

        Assert.Throws<DomainException>(() => ocorrencia.ConfirmarResolucao(Guid.NewGuid(), DateTime.UtcNow));

        ocorrencia.ConfirmarResolucao(_autor, DateTime.UtcNow);
        Assert.Equal(StatusOcorrencia.Resolvida, ocorrencia.Status);
        Assert.NotNull(ocorrencia.ResolvidaEm);
        Assert.Equal(0, ocorrencia.CalcularPrioridade());
    }

    [Fact]
    public void Ocorrencia_resolvida_nao_aceita_novos_apoios()
    {
        var ocorrencia = Fabrica.Via(_autor);
        ocorrencia.ConfirmarResolucao(_autor, DateTime.UtcNow);

        Assert.Throws<DomainException>(() => ocorrencia.Apoiar(Guid.NewGuid()));
    }

    [Fact]
    public void Apenas_autor_edita_e_exclui()
    {
        var ocorrencia = Fabrica.Via(_autor);
        var outro = Guid.NewGuid();

        Assert.Throws<DomainException>(() => ocorrencia.Editar(outro, "Novo", "Nova"));
        Assert.Throws<DomainException>(() => ocorrencia.GarantirQuePodeSerExcluidaPor(outro));

        ocorrencia.Editar(_autor, "  Novo título ", "Nova descrição");
        Assert.Equal("Novo título", ocorrencia.Titulo);
    }

    [Fact]
    public void Nao_exclui_quando_outros_usuarios_ja_apoiaram()
    {
        var ocorrencia = Fabrica.Via(_autor);
        ocorrencia.Apoiar(Guid.NewGuid());

        Assert.Throws<DomainException>(() => ocorrencia.GarantirQuePodeSerExcluidaPor(_autor));
    }

    [Theory]
    [InlineData("")]
    [InlineData("   ")]
    public void Titulo_obrigatorio(string titulo)
    {
        Assert.Throws<DomainException>(() =>
            new OcorrenciaVia(titulo, "Descrição", "Grajaú", _autor, "Referência"));
    }

    [Fact]
    public void Comentario_vazio_e_rejeitado()
    {
        var ocorrencia = Fabrica.Via(_autor);

        Assert.Throws<DomainException>(() => ocorrencia.Comentar(_autor, " "));
    }

    [Fact]
    public void Resumo_e_polimorfico()
    {
        Ocorrencia[] ocorrencias =
        [
            Fabrica.Transporte(_autor, "875a-10", TipoProblemaTransporte.Lotacao),
            Fabrica.Agua(_autor),
            Fabrica.Via(_autor)
        ];

        Assert.Equal(
            ["Linha 875A-10: Lotacao", "Falta de água em Grajaú há 12h", "Via danificada: Perto do terminal"],
            ocorrencias.Select(o => o.Resumir()));
    }

    [Fact]
    public void Duracao_negativa_e_rejeitada()
    {
        Assert.Throws<DomainException>(() => new OcorrenciaEnergia("Sem luz", "Desc", "Grajaú", _autor, -1));
    }
}
