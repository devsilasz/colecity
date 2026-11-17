using System.Net;
using System.Text;
using Colecity.Application.Exceptions;
using Colecity.Infrastructure.SpTrans;
using Microsoft.Extensions.Options;

namespace Colecity.Tests.Infraestrutura;

public class OlhoVivoSpTransClientTests
{
    /// <summary>Simula a API Olho Vivo: exige login antes de responder às consultas.</summary>
    private sealed class OlhoVivoFalso(bool tokenValido = true) : HttpMessageHandler
    {
        public List<string> Chamadas { get; } = [];
        private bool _autenticado;

        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken ct)
        {
            var caminho = request.RequestUri!.PathAndQuery;
            Chamadas.Add($"{request.Method} {caminho}");

            if (caminho.Contains("Login/Autenticar"))
            {
                _autenticado = tokenValido;
                return Responder(tokenValido ? "true" : "false");
            }
            if (!_autenticado)
                return Task.FromResult(new HttpResponseMessage(HttpStatusCode.Unauthorized));
            if (caminho.Contains("Linha/Buscar"))
                return Responder("""[{"cl":1273,"lc":false,"lt":"8000","sl":1,"tl":10,"tp":"PCA. RAMOS DE AZEVEDO","ts":"TERM. LAPA"}]""");

            return Responder("""{"hr":"11:30","vs":[{"p":11433,"a":true,"ta":"2026-11-14T14:30:01Z","py":-23.54,"px":-46.64}]}""");
        }

        private static Task<HttpResponseMessage> Responder(string json) =>
            Task.FromResult(new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(json, Encoding.UTF8, "application/json")
            });
    }

    private static OlhoVivoSpTransClient CriarCliente(HttpMessageHandler handler) =>
        new(new HttpClient(handler) { BaseAddress = new Uri("https://olhovivo.teste/v2.1/") },
            Options.Create(new SpTransOptions { Token = "token-teste" }));

    [Fact]
    public async Task Autentica_quando_recebe_401_e_converte_o_contrato()
    {
        var api = new OlhoVivoFalso();

        var linhas = await CriarCliente(api).BuscarLinhasAsync("8000");

        var linha = Assert.Single(linhas);
        Assert.Equal("8000-10", linha.Letreiro);
        Assert.Equal("TERM. LAPA", linha.TerminalSecundario);
        Assert.Equal(3, api.Chamadas.Count);
        Assert.StartsWith("POST /v2.1/Login/Autenticar?token=token-teste", api.Chamadas[1]);
    }

    [Fact]
    public async Task Le_posicao_dos_veiculos()
    {
        var posicao = await CriarCliente(new OlhoVivoFalso()).ObterPosicaoVeiculosAsync(1273);

        Assert.Equal("11:30", posicao.HorarioReferencia);
        var veiculo = Assert.Single(posicao.Veiculos);
        Assert.Equal("11433", veiculo.Prefixo);
        Assert.True(veiculo.Acessivel);
    }

    [Fact]
    public async Task Token_recusado_vira_servico_indisponivel()
    {
        await Assert.ThrowsAsync<ServicoExternoIndisponivelException>(() =>
            CriarCliente(new OlhoVivoFalso(tokenValido: false)).BuscarLinhasAsync("8000"));
    }
}
