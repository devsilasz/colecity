using Colecity.Application.Dtos;
using Colecity.Application.Exceptions;
using Colecity.Application.Services;
using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Repositories;
using Colecity.Infrastructure.Data;
using Colecity.Infrastructure.Repositories;
using Colecity.Tests.Suporte;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Tests.Aplicacao;

public sealed class OcorrenciaServiceTests : IDisposable
{
    private readonly BancoEmMemoria _banco = new();

    public void Dispose() => _banco.Dispose();

    private static OcorrenciaService CriarServico(ColecityDbContext db) =>
        new(new OcorrenciaRepository(db), new UsuarioRepository(db), db, TimeProvider.System);

    private async Task<Usuario> CadastrarUsuarioAsync(string email)
    {
        await using var db = _banco.CriarContexto();
        var usuario = Fabrica.Usuario(email);
        db.Usuarios.Add(usuario);
        await db.SaveChangesAsync();
        return usuario;
    }

    private static CriarOcorrenciaRequest PedidoTransporte(Guid autorId) => new()
    {
        Modulo = Modulo.Transporte,
        AutorId = autorId,
        Titulo = "Linha não passa",
        Descricao = "Espera de mais de uma hora",
        Bairro = "Jardim Ângela",
        CodigoLinha = "6072-10",
        TipoProblema = TipoProblemaTransporte.NaoPassou
    };

    [Fact]
    public async Task Cria_ocorrencia_do_tipo_do_modulo_e_persiste_apoio_do_autor()
    {
        var autor = await CadastrarUsuarioAsync("autor@exemplo.com");

        await using (var db = _banco.CriarContexto())
        {
            var criada = await CriarServico(db).CriarAsync(PedidoTransporte(autor.Id));
            Assert.Equal("6072-10", criada.CodigoLinha);
            Assert.Equal(1, criada.TotalApoios);
        }

        await using var leitura = _banco.CriarContexto();
        var salva = await leitura.Ocorrencias.Include(o => o.Apoios).SingleAsync();
        Assert.IsType<OcorrenciaTransporte>(salva);
        Assert.Single(salva.Apoios);
    }

    [Fact]
    public async Task Autor_inexistente_retorna_nao_encontrado()
    {
        await using var db = _banco.CriarContexto();

        await Assert.ThrowsAsync<RecursoNaoEncontradoException>(() =>
            CriarServico(db).CriarAsync(PedidoTransporte(Guid.NewGuid())));
    }

    [Fact]
    public async Task Campos_obrigatorios_do_modulo_sao_validados()
    {
        var autor = await CadastrarUsuarioAsync("autor@exemplo.com");
        await using var db = _banco.CriarContexto();

        var pedido = PedidoTransporte(autor.Id) with { CodigoLinha = null };

        await Assert.ThrowsAsync<DomainException>(() => CriarServico(db).CriarAsync(pedido));
    }

    [Fact]
    public async Task Apoio_e_comentario_sao_persistidos_em_requisicoes_separadas()
    {
        var autor = await CadastrarUsuarioAsync("autor@exemplo.com");
        var apoiador = await CadastrarUsuarioAsync("apoiador@exemplo.com");

        Guid id;
        await using (var db = _banco.CriarContexto())
            id = (await CriarServico(db).CriarAsync(PedidoTransporte(autor.Id))).Id;

        await using (var db = _banco.CriarContexto())
        {
            var apoiada = await CriarServico(db).ApoiarAsync(id, apoiador.Id);
            Assert.Equal(2, apoiada.TotalApoios);
        }

        await using (var db = _banco.CriarContexto())
            await CriarServico(db).ComentarAsync(id, new ComentarRequest { UsuarioId = apoiador.Id, Texto = "Aqui também" });

        await using var leitura = _banco.CriarContexto();
        var servico = CriarServico(leitura);
        Assert.Equal(2, (await servico.ObterAsync(id)).TotalApoios);
        Assert.Equal("Aqui também", Assert.Single(await servico.ListarComentariosAsync(id)).Texto);
    }

    [Fact]
    public async Task Listagem_filtra_por_linha_e_pagina()
    {
        var autor = await CadastrarUsuarioAsync("autor@exemplo.com");
        await using (var db = _banco.CriarContexto())
        {
            db.Ocorrencias.AddRange(
                Fabrica.Transporte(autor.Id, "6072-10"),
                Fabrica.Transporte(autor.Id, "6072-10", TipoProblemaTransporte.Atraso),
                Fabrica.Transporte(autor.Id, "8000-10"),
                Fabrica.Via(autor.Id));
            await db.SaveChangesAsync();
        }

        await using var leitura = _banco.CriarContexto();
        var pagina = await CriarServico(leitura).ListarAsync(new FiltroOcorrencias(CodigoLinha: "6072-10", TamanhoPagina: 1));

        Assert.Equal(2, pagina.Total);
        Assert.Equal(2, pagina.TotalPaginas);
        Assert.All(pagina.Itens, o => Assert.Equal("6072-10", o.CodigoLinha));
    }

    [Fact]
    public async Task Exclui_ocorrencia_apoiada_somente_pelo_autor()
    {
        var autor = await CadastrarUsuarioAsync("autor@exemplo.com");
        Guid id;
        await using (var db = _banco.CriarContexto())
            id = (await CriarServico(db).CriarAsync(PedidoTransporte(autor.Id))).Id;

        await using (var db = _banco.CriarContexto())
            await CriarServico(db).ExcluirAsync(id, autor.Id);

        await using var leitura = _banco.CriarContexto();
        Assert.False(await leitura.Ocorrencias.AnyAsync());
        Assert.False(await leitura.Apoios.AnyAsync());
    }
}
