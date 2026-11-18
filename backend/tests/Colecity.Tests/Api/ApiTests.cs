using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;

namespace Colecity.Tests.Api;

public class ApiTests(ColecityApiFactory api) : IClassFixture<ColecityApiFactory>
{
    private const string Base = "/api/v1";

    private static object NovaOcorrencia(string categoria = "VIAS", string tipo = "BURACO", double lat = -23.5614, double lng = -46.6559) => new
    {
        categoria,
        tipo,
        descricao = "Buraco fundo na faixa da direita.",
        localizacao = new { lat, lng }
    };

    private static async Task<HttpResponseMessage> RegistrarAsync(HttpClient cliente, object corpo, string? chave = null)
    {
        var requisicao = new HttpRequestMessage(HttpMethod.Post, $"{Base}/ocorrencias") { Content = JsonContent.Create(corpo) };
        requisicao.Headers.Add("Idempotency-Key", chave ?? Guid.NewGuid().ToString());
        return await cliente.SendAsync(requisicao);
    }

    // ---- Convenções do contrato ----

    [Fact]
    public async Task Health_check_e_publico_e_segue_o_contrato()
    {
        var resposta = await api.CreateClient().GetAsync($"{Base}/health");

        Assert.Equal(HttpStatusCode.OK, resposta.StatusCode);
        Assert.Equal("ok", (await resposta.LerAsync<JsonElement>()).GetProperty("status").GetString());
    }

    [Fact]
    public async Task Sem_credencial_de_servico_responde_401()
    {
        var resposta = await api.CreateClient().GetAsync($"{Base}/categorias");

        Assert.Equal(HttpStatusCode.Unauthorized, resposta.StatusCode);
        Assert.Equal("NAO_AUTENTICADO", await resposta.CodigoAsync());
    }

    [Fact]
    public async Task Rota_com_cadeado_exige_X_User_Id_e_usuario_cadastrado()
    {
        var semUsuario = await api.Cliente().GetAsync($"{Base}/usuarios/me");
        var naoCadastrado = await api.Cliente("uid-inexistente").GetAsync($"{Base}/usuarios/me");

        Assert.Equal(HttpStatusCode.Unauthorized, semUsuario.StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, naoCadastrado.StatusCode);
        Assert.Equal("USUARIO_NAO_CADASTRADO", await naoCadastrado.CodigoAsync());
    }

    [Fact]
    public async Task Enums_em_upper_snake_case_datas_em_utc_e_paginacao_do_contrato()
    {
        var json = await (await api.Cliente().GetAsync($"{Base}/ocorrencias?estado=EM_ACOMPANHAMENTO&pageSize=2")).LerAsync<JsonElement>();

        Assert.Equal(2, json.GetProperty("pageSize").GetInt32());
        Assert.True(json.GetProperty("total").GetInt32() >= 2);
        var item = json.GetProperty("items")[0];
        Assert.Equal("EM_ACOMPANHAMENTO", item.GetProperty("estado").GetString());
        Assert.EndsWith("Z", item.GetProperty("ultimaAtividadeEm").GetString());
        Assert.Equal(JsonValueKind.Null, item.GetProperty("minhaParticipacao").ValueKind);
    }

    [Fact]
    public async Task Documentacao_openapi_swagger_e_scalar_sao_publicados()
    {
        var cliente = api.CreateClient();
        var documento = await (await cliente.GetAsync("/openapi/v1.json")).LerAsync<JsonElement>();

        var registrar = documento.GetProperty("paths").GetProperty("/api/v1/ocorrencias").GetProperty("post");
        Assert.Contains(registrar.GetProperty("parameters").EnumerateArray(), p => p.GetProperty("name").GetString() == "Idempotency-Key");
        Assert.True(documento.GetProperty("components").GetProperty("securitySchemes").TryGetProperty("ServiceKey", out _));
        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync("/swagger/index.html")).StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await cliente.GetAsync("/scalar/")).StatusCode);
    }

    // ---- Jornadas ----

    [Fact]
    public async Task Registro_e_idempotente_pela_chave()
    {
        var cliente = await api.NovoUsuarioAsync();

        var primeira = await RegistrarAsync(cliente, NovaOcorrencia(), "chave-fixa");
        var repetida = await RegistrarAsync(cliente, NovaOcorrencia(), "chave-fixa");
        var semChave = await cliente.PostAsJsonAsync($"{Base}/ocorrencias", NovaOcorrencia());

        Assert.Equal(HttpStatusCode.Created, primeira.StatusCode);
        Assert.Equal(HttpStatusCode.Created, repetida.StatusCode);
        Assert.Equal((await primeira.LerAsync<OcorrenciaDetalheResponse>()).Id, (await repetida.LerAsync<OcorrenciaDetalheResponse>()).Id);
        Assert.True(repetida.Headers.Contains("Idempotent-Replayed"));
        Assert.Equal("IDEMPOTENCY_KEY_OBRIGATORIA", await semChave.CodigoAsync());
    }

    [Fact]
    public async Task Jornada_completa_de_participacao_comentario_e_conclusao()
    {
        var autora = await api.NovoUsuarioAsync();
        var vizinha = await api.NovoUsuarioAsync();
        var criada = await RegistrarAsync(autora, NovaOcorrencia());
        var ocorrencia = await criada.LerAsync<OcorrenciaDetalheResponse>();
        Assert.Equal($"/api/v1/ocorrencias/{ocorrencia.Id}", criada.Headers.Location!.AbsolutePath);

        var apoio = await (await vizinha.PutAsync($"{Base}/ocorrencias/{ocorrencia.Id}/participacoes/apoio", null)).LerAsync<ParticipacaoResponse>();
        Assert.Equal((1, 1), (apoio.TotalAfetados, apoio.TotalApoios));
        Assert.Equal(HttpStatusCode.NoContent,
            (await vizinha.DeleteAsync($"{Base}/ocorrencias/{ocorrencia.Id}/participacoes/afetado")).StatusCode);

        var comentario = new HttpRequestMessage(HttpMethod.Post, $"{Base}/ocorrencias/{ocorrencia.Id}/comentarios")
        {
            Content = JsonContent.Create(new { texto = "Também passo por aqui todo dia." })
        };
        comentario.Headers.Add("Idempotency-Key", Guid.NewGuid().ToString());
        Assert.Equal(HttpStatusCode.Created, (await vizinha.SendAsync(comentario)).StatusCode);

        var naoAutor = await vizinha.PostAsJsonAsync($"{Base}/ocorrencias/{ocorrencia.Id}/conclusao", new { });
        Assert.Equal("SOMENTE_AUTOR", await naoAutor.CodigoAsync());

        var concluida = await (await autora.PostAsJsonAsync($"{Base}/ocorrencias/{ocorrencia.Id}/conclusao",
            new { feedback = "A prefeitura tapou o buraco." })).LerAsync<OcorrenciaDetalheResponse>();
        Assert.Equal(EstadoOcorrencia.Concluida, concluida.Estado);
        Assert.Equal(MotivoConclusao.Autor, concluida.Conclusao!.Motivo);

        var depois = await vizinha.PutAsync($"{Base}/ocorrencias/{ocorrencia.Id}/participacoes/afetado", null);
        Assert.Equal(HttpStatusCode.Conflict, depois.StatusCode);
        Assert.Equal("OCORRENCIA_CONCLUIDA", await depois.CodigoAsync());

        var apoiadores = await (await api.Cliente().GetAsync($"{Base}/ocorrencias/{ocorrencia.Id}/apoiadores")).LerAsync<Pagina<ApoiadorResponse>>();
        Assert.Equal("Pessoa de Teste", Assert.Single(apoiadores.Items).Nome);
    }

    [Fact]
    public async Task Regras_de_negocio_viram_422_com_code_e_errors()
    {
        var cliente = await api.NovoUsuarioAsync();

        var foraDeSp = await RegistrarAsync(cliente, NovaOcorrencia(lat: -23.4538, lng: -46.5333));
        var obrigatorios = await RegistrarAsync(cliente, new { categoria = "VIAS" });

        Assert.Equal(HttpStatusCode.UnprocessableEntity, foraDeSp.StatusCode);
        Assert.Equal("LOCALIZACAO_FORA_DO_MUNICIPIO", await foraDeSp.CodigoAsync());
        var erros = (await obrigatorios.LerAsync<JsonElement>()).GetProperty("errors");
        Assert.Equal(["tipo", "descricao", "localizacao"], erros.EnumerateObject().Select(p => p.Name));
    }

    [Fact]
    public async Task Json_invalido_ou_campo_extra_vira_400_sem_detalhes_internos()
    {
        var cliente = await api.NovoUsuarioAsync();

        var campoExtra = await cliente.PatchAsJsonAsync($"{Base}/usuarios/me", new { nome = "Novo Nome", uid = "outro" });
        var enumInvalido = await cliente.GetAsync($"{Base}/ocorrencias?estado=INEXISTENTE");
        var raioInvalido = await cliente.GetAsync($"{Base}/ocorrencias?lat=-23.55&lng=-46.63&raioKm=3");

        Assert.Equal(HttpStatusCode.BadRequest, campoExtra.StatusCode);
        Assert.DoesNotContain("Colecity.", await campoExtra.Content.ReadAsStringAsync());
        Assert.Equal(HttpStatusCode.BadRequest, enumInvalido.StatusCode);
        Assert.Equal("REQUISICAO_INVALIDA", await raioInvalido.CodigoAsync());
    }

    [Fact]
    public async Task Email_duplicado_responde_409()
    {
        var cliente = await api.NovoUsuarioAsync();

        var resposta = await cliente.PatchAsJsonAsync($"{Base}/usuarios/me", new { email = "ana@exemplo.com" });

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);
        Assert.Equal("EMAIL_JA_CADASTRADO", await resposta.CodigoAsync());
    }

    [Fact]
    public async Task Exclusao_de_conta_impede_novos_acessos()
    {
        var uid = $"uid-{Guid.NewGuid():N}";
        var cliente = await api.NovoUsuarioAsync(uid);

        Assert.Equal(HttpStatusCode.NoContent, (await cliente.DeleteAsync($"{Base}/usuarios/me")).StatusCode);
        Assert.Equal(HttpStatusCode.Forbidden, (await cliente.GetAsync($"{Base}/usuarios/me")).StatusCode);
    }

    [Fact]
    public async Task Transporte_ao_vivo_detecta_e_registra_desvio()
    {
        var passageiro = await api.NovoUsuarioAsync();
        var linhas = await (await passageiro.GetAsync($"{Base}/transporte/linhas?busca=8700")).LerAsync<List<LinhaTransporteResponse>>();
        Assert.Equal(["Pça. Ramos", "Pq. Continental"], Assert.Single(linhas).Sentidos.Select(s => s.Destino));

        var veiculos = await (await passageiro.GetAsync($"{Base}/transporte/linhas/8700-10/veiculos?sentido=1")).LerAsync<List<VeiculoResponse>>();
        Assert.NotEmpty(veiculos);
        Assert.All(veiculos, v => Assert.Equal(FontePosicao.Sptrans, v.Fonte));

        var viagem = await (await passageiro.PostAsJsonAsync($"{Base}/transporte/viagens", new { linha = "8700-10", sentido = 1 }))
            .LerAsync<ViagemIniciadaResponse>();
        PosicaoRegistradaResponse? ultima = null;
        for (var minutos = 3; minutos >= 1; minutos--)
            ultima = await (await passageiro.PostAsJsonAsync($"{Base}/transporte/viagens/{viagem.ViagemId}/posicoes", new
            {
                posicao = new { lat = -23.5100, lng = -46.7050 },
                registradaEm = DateTime.UtcNow.AddMinutes(-minutos)
            })).LerAsync<PosicaoRegistradaResponse>();
        Assert.True(ultima!.DesvioSuspeito);

        var desvio = await (await passageiro.PostAsJsonAsync($"{Base}/transporte/viagens/{viagem.ViagemId}/desvio", new { confirmado = true }))
            .LerAsync<DesvioRespondidoResponse>();
        var ocorrencia = await (await api.Cliente().GetAsync($"{Base}/ocorrencias/{desvio.OcorrenciaId}")).LerAsync<OcorrenciaDetalheResponse>();
        Assert.Equal(TipoOcorrencia.AlteracaoRotaSemAviso, ocorrencia.Tipo);
        Assert.Equal("8700-10", ocorrencia.Linha!.Codigo);

        var outroUsuario = await api.NovoUsuarioAsync();
        Assert.Equal(HttpStatusCode.NotFound, (await outroUsuario.PostAsync($"{Base}/transporte/viagens/{viagem.ViagemId}/encerrar", null)).StatusCode);
    }

    [Fact]
    public async Task Admin_de_moderacao_exige_credencial_propria()
    {
        var comChaveDoBff = await api.Cliente().GetAsync($"{Base}/admin/denuncias");
        var admin = api.CreateClient();
        admin.DefaultRequestHeaders.Add("X-Admin-Key", ColecityApiFactory.ChaveAdmin);

        Assert.Equal(HttpStatusCode.Unauthorized, comChaveDoBff.StatusCode);
        Assert.Equal(HttpStatusCode.OK, (await admin.GetAsync($"{Base}/admin/denuncias")).StatusCode);
    }
}

public class LimiteDeRequisicoesTests(ColecityApiComLimiteFactory api) : IClassFixture<ColecityApiComLimiteFactory>
{
    [Fact]
    public async Task Acima_do_limite_responde_429()
    {
        var cliente = api.Cliente("uid-apressado");
        for (var i = 0; i < 3; i++)
            await cliente.GetAsync("/api/v1/categorias");

        var resposta = await cliente.GetAsync("/api/v1/categorias");

        Assert.Equal(HttpStatusCode.TooManyRequests, resposta.StatusCode);
        Assert.Equal("MUITAS_REQUISICOES", await resposta.CodigoAsync());
    }
}
