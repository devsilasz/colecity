using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Colecity.Application.Dtos;
using Colecity.Domain.Enums;

namespace Colecity.Tests.Api;

public class ApiTests(ColecityApiFactory factory) : IClassFixture<ColecityApiFactory>
{
    private static readonly JsonSerializerOptions Json = new(JsonSerializerDefaults.Web)
    {
        Converters = { new JsonStringEnumConverter() }
    };

    private readonly HttpClient _http = factory.CreateClient();

    private async Task<UsuarioResponse> CriarUsuarioAsync()
    {
        var resposta = await _http.PostAsJsonAsync("/api/usuarios",
            new CriarUsuarioRequest { Nome = "Teste", Email = $"{Guid.NewGuid():N}@exemplo.com", Bairro = "Grajaú" }, Json);
        Assert.Equal(HttpStatusCode.Created, resposta.StatusCode);
        return (await resposta.Content.ReadFromJsonAsync<UsuarioResponse>(Json))!;
    }

    [Fact]
    public async Task Documentacao_openapi_e_publicada()
    {
        var documento = await _http.GetFromJsonAsync<JsonElement>("/openapi/v1.json");

        Assert.Equal("Colecity API", documento.GetProperty("info").GetProperty("title").GetString());
        Assert.True(documento.GetProperty("paths").TryGetProperty("/api/ocorrencias/{id}/apoios", out _));
        Assert.Equal(HttpStatusCode.OK, (await _http.GetAsync("/scalar/")).StatusCode);
    }

    [Fact]
    public async Task Fluxo_completo_de_abaixo_assinado()
    {
        var autor = await CriarUsuarioAsync();
        var criar = await _http.PostAsJsonAsync("/api/ocorrencias", new CriarOcorrenciaRequest
        {
            Modulo = Modulo.Vias, AutorId = autor.Id, Titulo = "Buraco", Descricao = "Buraco fundo",
            Bairro = "Grajaú", PontoReferencia = "Perto da escola"
        }, Json);
        Assert.Equal(HttpStatusCode.Created, criar.StatusCode);
        var ocorrencia = (await criar.Content.ReadFromJsonAsync<OcorrenciaResponse>(Json))!;
        Assert.Equal(criar.Headers.Location!.AbsolutePath, $"/api/ocorrencias/{ocorrencia.Id}");

        OcorrenciaResponse? atual = null;
        for (var i = 0; i < 2; i++)
        {
            var apoiador = await CriarUsuarioAsync();
            var apoio = await _http.PostAsJsonAsync($"/api/ocorrencias/{ocorrencia.Id}/apoios",
                new AcaoUsuarioRequest { UsuarioId = apoiador.Id }, Json);
            atual = await apoio.Content.ReadFromJsonAsync<OcorrenciaResponse>(Json);
        }

        Assert.Equal(3, atual!.TotalApoios);
        Assert.Equal(StatusOcorrencia.AbaixoAssinado, atual.Status);

        var duplicado = await _http.PostAsJsonAsync($"/api/ocorrencias/{ocorrencia.Id}/apoios",
            new AcaoUsuarioRequest { UsuarioId = autor.Id }, Json);
        Assert.Equal(HttpStatusCode.UnprocessableEntity, duplicado.StatusCode);
    }

    [Fact]
    public async Task Requisicao_invalida_retorna_400()
    {
        var resposta = await _http.PostAsJsonAsync("/api/usuarios", new { nome = "", email = "invalido", bairro = "" });

        Assert.Equal(HttpStatusCode.BadRequest, resposta.StatusCode);
    }

    [Fact]
    public async Task Ocorrencia_inexistente_retorna_404_com_problem_details()
    {
        var resposta = await _http.GetAsync($"/api/ocorrencias/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.NotFound, resposta.StatusCode);
        Assert.Equal("application/problem+json", resposta.Content.Headers.ContentType?.MediaType);
    }

    [Fact]
    public async Task Email_duplicado_retorna_409()
    {
        var pedido = new CriarUsuarioRequest { Nome = "Ana", Email = "duplicado@exemplo.com", Bairro = "Grajaú" };
        await _http.PostAsJsonAsync("/api/usuarios", pedido, Json);

        var resposta = await _http.PostAsJsonAsync("/api/usuarios", pedido, Json);

        Assert.Equal(HttpStatusCode.Conflict, resposta.StatusCode);
    }

    [Fact]
    public async Task Situacao_da_linha_usa_dados_da_sptrans()
    {
        var situacao = await _http.GetFromJsonAsync<SituacaoLinhaResponse>("/api/linhas/8000-10/situacao", Json);

        Assert.Equal("8000-10", situacao!.Letreiro);
        Assert.True(situacao.TotalVeiculosEmOperacao > 0);
    }
}
