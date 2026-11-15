using Colecity.Domain.Entities;
using Colecity.Domain.Enums;

namespace Colecity.Tests.Suporte;

public static class Fabrica
{
    public static Usuario Usuario(string email = "ana@exemplo.com") => new("Ana Souza", email, "Jardim Ângela");

    public static OcorrenciaTransporte Transporte(Guid autorId, string linha = "6072-10",
        TipoProblemaTransporte tipo = TipoProblemaTransporte.NaoPassou) =>
        new("Linha não passa", "Espera de mais de uma hora", "Jardim Ângela", autorId, linha, tipo);

    public static OcorrenciaVia Via(Guid autorId) =>
        new("Buraco", "Buraco grande", "Grajaú", autorId, "Perto do terminal");

    public static OcorrenciaAgua Agua(Guid autorId) =>
        new("Sem água", "Rua sem abastecimento", "Grajaú", autorId, 12);
}
