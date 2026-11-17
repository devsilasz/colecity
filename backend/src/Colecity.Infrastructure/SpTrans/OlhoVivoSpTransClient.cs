using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.Json.Serialization;
using Colecity.Application.Abstractions;
using Colecity.Application.Exceptions;
using Microsoft.Extensions.Options;

namespace Colecity.Infrastructure.SpTrans;

/// <summary>
/// Cliente da API Olho Vivo da SPTrans. A autenticação é feita por cookie: quando a API responde 401,
/// o cliente autentica com o token e repete a chamada uma vez.
/// </summary>
public class OlhoVivoSpTransClient(HttpClient http, IOptions<SpTransOptions> options) : ISpTransClient
{
    private const string NomeServico = "SPTrans Olho Vivo";

    public async Task<IReadOnlyList<LinhaSpTrans>> BuscarLinhasAsync(string termo, CancellationToken ct = default)
    {
        var linhas = await GetAutenticadoAsync<List<LinhaOlhoVivo>>(
            $"Linha/Buscar?termosBusca={Uri.EscapeDataString(termo)}", ct);

        return linhas?
            .Select(l => new LinhaSpTrans(l.CodigoLinha, $"{l.Prefixo}-{l.Tipo}", l.Sentido, l.TerminalPrincipal, l.TerminalSecundario))
            .ToList() ?? [];
    }

    public async Task<PosicaoLinhaSpTrans> ObterPosicaoVeiculosAsync(int codigoLinha, CancellationToken ct = default)
    {
        var posicao = await GetAutenticadoAsync<PosicaoOlhoVivo>($"Posicao/Linha?codigoLinha={codigoLinha}", ct);

        var veiculos = posicao?.Veiculos?
            .Select(v => new VeiculoSpTrans(v.Prefixo.ToString(), v.Acessivel, v.Latitude, v.Longitude, v.AtualizadoEm?.ToUniversalTime()))
            .ToList() ?? [];
        return new PosicaoLinhaSpTrans(posicao?.Horario ?? "", veiculos);
    }

    private async Task<T?> GetAutenticadoAsync<T>(string uri, CancellationToken ct)
    {
        try
        {
            using var resposta = await http.GetAsync(uri, ct);
            if (resposta.StatusCode != HttpStatusCode.Unauthorized)
                return await LerAsync<T>(resposta, ct);

            await AutenticarAsync(ct);
            using var novaTentativa = await http.GetAsync(uri, ct);
            return await LerAsync<T>(novaTentativa, ct);
        }
        catch (Exception ex) when (ex is HttpRequestException or JsonException or TaskCanceledException && !ct.IsCancellationRequested)
        {
            throw new ServicoExternoIndisponivelException(NomeServico, ex);
        }
    }

    private async Task AutenticarAsync(CancellationToken ct)
    {
        var token = Uri.EscapeDataString(options.Value.Token ?? "");
        using var resposta = await http.PostAsync($"Login/Autenticar?token={token}", content: null, ct);
        var autenticado = resposta.IsSuccessStatusCode && await resposta.Content.ReadFromJsonAsync<bool>(ct);
        if (!autenticado)
            throw new ServicoExternoIndisponivelException(NomeServico);
    }

    private static async Task<T?> LerAsync<T>(HttpResponseMessage resposta, CancellationToken ct)
    {
        resposta.EnsureSuccessStatusCode();
        return await resposta.Content.ReadFromJsonAsync<T>(ct);
    }

    // Contratos JSON da API Olho Vivo (nomes abreviados definidos pela SPTrans).
    private sealed record LinhaOlhoVivo(
        [property: JsonPropertyName("cl")] int CodigoLinha,
        [property: JsonPropertyName("lt")] string Prefixo,
        [property: JsonPropertyName("tl")] int Tipo,
        [property: JsonPropertyName("sl")] int Sentido,
        [property: JsonPropertyName("tp")] string TerminalPrincipal,
        [property: JsonPropertyName("ts")] string TerminalSecundario);

    private sealed record PosicaoOlhoVivo(
        [property: JsonPropertyName("hr")] string Horario,
        [property: JsonPropertyName("vs")] List<VeiculoOlhoVivo>? Veiculos);

    private sealed record VeiculoOlhoVivo(
        [property: JsonPropertyName("p")] JsonElement Prefixo,
        [property: JsonPropertyName("a")] bool Acessivel,
        [property: JsonPropertyName("ta")] DateTime? AtualizadoEm,
        [property: JsonPropertyName("py")] double Latitude,
        [property: JsonPropertyName("px")] double Longitude);
}
