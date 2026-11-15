using Colecity.Application.Abstractions;

namespace Colecity.Infrastructure.SpTrans;

/// <summary>
/// Substituto da API Olho Vivo com dados simulados, usado quando nenhum token da SPTrans é configurado.
/// Mantém o mesmo contrato, então a aplicação funciona igual nos dois modos.
/// </summary>
public class SpTransSimuladoClient(TimeProvider relogio) : ISpTransClient
{
    private static readonly LinhaSpTrans[] Linhas =
    [
        new(34001, "6072-10", 1, "TERM. VARGINHA", "JD. HERCULANO"),
        new(34002, "6072-10", 2, "TERM. VARGINHA", "JD. HERCULANO"),
        new(1273, "8000-10", 1, "PCA. RAMOS DE AZEVEDO", "TERM. LAPA"),
        new(34041, "8000-10", 2, "PCA. RAMOS DE AZEVEDO", "TERM. LAPA"),
        new(2506, "875A-10", 1, "PERDIZES", "METRÔ BUTANTÃ"),
        new(35274, "875A-10", 2, "PERDIZES", "METRÔ BUTANTÃ"),
        new(1500, "5119-10", 1, "TERM. CAPELINHA", "METRÔ SANTA CRUZ"),
        new(34268, "5119-10", 2, "TERM. CAPELINHA", "METRÔ SANTA CRUZ")
    ];

    // Linha sem nenhum ônibus em operação, para demonstrar o alerta do cruzamento com os relatos.
    private const string LinhaSemOperacao = "6072-10";

    private static readonly TimeZoneInfo FusoSaoPaulo = TimeZoneInfo.FindSystemTimeZoneById("America/Sao_Paulo");

    public Task<IReadOnlyList<LinhaSpTrans>> BuscarLinhasAsync(string termo, CancellationToken ct = default)
    {
        var termoNormalizado = termo.Trim();
        IReadOnlyList<LinhaSpTrans> encontradas = Linhas
            .Where(l => l.Letreiro.Contains(termoNormalizado, StringComparison.OrdinalIgnoreCase)
                     || l.TerminalPrincipal.Contains(termoNormalizado, StringComparison.OrdinalIgnoreCase)
                     || l.TerminalSecundario.Contains(termoNormalizado, StringComparison.OrdinalIgnoreCase))
            .ToList();
        return Task.FromResult(encontradas);
    }

    public Task<PosicaoLinhaSpTrans> ObterPosicaoVeiculosAsync(int codigoLinha, CancellationToken ct = default)
    {
        var horario = TimeZoneInfo.ConvertTime(relogio.GetUtcNow(), FusoSaoPaulo).ToString("HH:mm");
        var linha = Linhas.FirstOrDefault(l => l.CodigoLinha == codigoLinha);
        if (linha is null || linha.Letreiro == LinhaSemOperacao)
            return Task.FromResult(new PosicaoLinhaSpTrans(horario, []));

        var aleatorio = new Random(codigoLinha);
        var veiculos = Enumerable.Range(0, aleatorio.Next(2, 8))
            .Select(_ => new VeiculoSpTrans(
                Prefixo: aleatorio.Next(10000, 99999).ToString(),
                Acessivel: aleatorio.NextDouble() > 0.2,
                Latitude: -23.55 + aleatorio.NextDouble() / 10,
                Longitude: -46.63 - aleatorio.NextDouble() / 10))
            .ToList();
        return Task.FromResult(new PosicaoLinhaSpTrans(horario, veiculos));
    }
}
