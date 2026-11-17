using Colecity.Domain.Enums;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>Dados já interpretados para registrar uma ocorrência.</summary>
public sealed record NovaOcorrencia(
    Categoria Categoria,
    TipoOcorrencia Tipo,
    string Descricao,
    Coordenada Localizacao,
    Endereco? Endereco,
    Usuario Autor,
    IReadOnlyCollection<string> Fotos,
    DateTime Agora,
    LinhaReferencia? Linha = null,
    DateTime? DataHoraOcorrido = null);

/// <summary>Linha de ônibus já validada no GTFS.</summary>
public sealed record LinhaReferencia(string Codigo, string Nome);
