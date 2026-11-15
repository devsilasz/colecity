using Colecity.Domain.Enums;

namespace Colecity.Domain.Repositories;

public record FiltroOcorrencias(
    Modulo? Modulo = null,
    StatusOcorrencia? Status = null,
    string? Bairro = null,
    string? CodigoLinha = null,
    int Pagina = 1,
    int TamanhoPagina = 20);
