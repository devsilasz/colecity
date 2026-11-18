using Colecity.Domain.Exceptions;

namespace Colecity.Application.Services;

/// <summary>Junta todos os campos obrigatórios ausentes em um único erro <c>CAMPO_OBRIGATORIO</c> (RN-REG-02).</summary>
internal sealed class CamposObrigatorios
{
    private readonly Dictionary<string, string[]> _faltando = [];

    public CamposObrigatorios Exigir(object? valor, string campo)
    {
        if (valor is null || valor is string texto && string.IsNullOrWhiteSpace(texto))
            _faltando[campo] = ["Campo obrigatório."];
        return this;
    }

    public void Validar()
    {
        if (_faltando.Count > 0)
            throw new DomainException(CodigosErro.CampoObrigatorio, "Preencha os campos obrigatórios.", _faltando);
    }
}

internal static class Texto
{
    public static string? CodigoLinha(string? linha) =>
        string.IsNullOrWhiteSpace(linha) ? null : linha.Trim().ToUpperInvariant();

    public static DateTime Utc(DateTime data) => data.Kind switch
    {
        DateTimeKind.Utc => data,
        DateTimeKind.Local => data.ToUniversalTime(),
        _ => DateTime.SpecifyKind(data, DateTimeKind.Utc)
    };
}
