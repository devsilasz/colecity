namespace Colecity.Application.Abstractions;

/// <summary>Contrato de acesso aos dados em tempo real da SPTrans (API Olho Vivo).</summary>
public interface ISpTransClient
{
    Task<IReadOnlyList<LinhaSpTrans>> BuscarLinhasAsync(string termo, CancellationToken ct = default);
    Task<PosicaoLinhaSpTrans> ObterPosicaoVeiculosAsync(int codigoLinha, CancellationToken ct = default);
}

/// <param name="CodigoLinha">Código interno da linha na SPTrans (cl).</param>
/// <param name="Letreiro">Letreiro completo, ex.: 6072-10.</param>
/// <param name="Sentido">1 = terminal principal para secundário, 2 = volta.</param>
public record LinhaSpTrans(int CodigoLinha, string Letreiro, int Sentido, string TerminalPrincipal, string TerminalSecundario)
{
    public string Destino => Sentido == 1 ? TerminalSecundario : TerminalPrincipal;
}

public record PosicaoLinhaSpTrans(string HorarioReferencia, IReadOnlyList<VeiculoSpTrans> Veiculos);

public record VeiculoSpTrans(string Prefixo, bool Acessivel, double Latitude, double Longitude);
