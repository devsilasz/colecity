namespace Colecity.Infrastructure.SpTrans;

public class SpTransOptions
{
    public const string Secao = "SpTrans";

    public string BaseUrl { get; set; } = "https://api.olhovivo.sptrans.com.br/v2.1/";

    /// <summary>Token da API Olho Vivo. Vazio = usa o cliente com dados simulados.</summary>
    public string? Token { get; set; }
}
