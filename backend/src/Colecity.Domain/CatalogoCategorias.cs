using Colecity.Domain.Enums;

namespace Colecity.Domain;

/// <summary>Categorias, tipos e seus nomes de exibição (RN-REG-05). Cada tipo pertence a exatamente uma categoria.</summary>
public static class CatalogoCategorias
{
    public sealed record ItemTipo(TipoOcorrencia Tipo, string Nome);

    public sealed record ItemCategoria(Categoria Categoria, string Nome, IReadOnlyList<ItemTipo> Tipos);

    public static IReadOnlyList<ItemCategoria> Todas { get; } =
    [
        new(Categoria.Transporte, "Transporte",
        [
            new(TipoOcorrencia.AtrasoIntervaloExcessivo, "Atraso ou intervalo excessivo"),
            new(TipoOcorrencia.AlteracaoRotaSemAviso, "Alteração de rota sem aviso"),
            new(TipoOcorrencia.LinhaEstacaoForaOperacao, "Linha/estação fora de operação"),
            new(TipoOcorrencia.Superlotacao, "Superlotação"),
            new(TipoOcorrencia.PontoEstacaoDanificado, "Ponto/estação danificado")
        ]),
        new(Categoria.Agua, "Água",
        [
            new(TipoOcorrencia.FaltaAbastecimento, "Falta de abastecimento"),
            new(TipoOcorrencia.BaixaPressao, "Baixa pressão"),
            new(TipoOcorrencia.VazamentoVia, "Vazamento na via"),
            new(TipoOcorrencia.AguaAparenciaAlterada, "Água com aparência alterada")
        ]),
        new(Categoria.Energia, "Energia",
        [
            new(TipoOcorrencia.FaltaEnergia, "Falta de energia"),
            new(TipoOcorrencia.Oscilacao, "Oscilação"),
            new(TipoOcorrencia.FiacaoExpostaCaida, "Fiação exposta ou caída"),
            new(TipoOcorrencia.IluminacaoPublicaApagada, "Iluminação pública apagada")
        ]),
        new(Categoria.Vias, "Vias",
        [
            new(TipoOcorrencia.Buraco, "Buraco"),
            new(TipoOcorrencia.Alagamento, "Alagamento"),
            new(TipoOcorrencia.CalcadaDanificada, "Calçada danificada"),
            new(TipoOcorrencia.SemaforoSinalizacaoDefeito, "Semáforo/sinalização com defeito")
        ]),
        new(Categoria.Arvores, "Árvores",
        [
            new(TipoOcorrencia.ArvoreCaida, "Árvore caída"),
            new(TipoOcorrencia.GalhoRiscoQueda, "Galho com risco de queda"),
            new(TipoOcorrencia.ArvoreSobreFiacao, "Árvore sobre fiação")
        ]),
        new(Categoria.Seguranca, "Segurança",
        [
            new(TipoOcorrencia.AssaltoRoubo, "Assalto/roubo"),
            new(TipoOcorrencia.Furto, "Furto"),
            new(TipoOcorrencia.LocalMalIluminadoErmo, "Local mal iluminado ou ermo")
        ]),
        new(Categoria.RiscosInfraestrutura, "Riscos e infraestrutura",
        [
            new(TipoOcorrencia.RiscoDeslizamento, "Risco de deslizamento"),
            new(TipoOcorrencia.TrechoPerigosoPedestres, "Trecho perigoso para pedestres"),
            new(TipoOcorrencia.EstruturaRiscoQueda, "Imóvel/estrutura com risco de queda"),
            new(TipoOcorrencia.CorregoTransbordando, "Córrego transbordando")
        ])
    ];

    private static readonly Dictionary<TipoOcorrencia, (Categoria Categoria, string Nome)> PorTipo = Todas
        .SelectMany(c => c.Tipos.Select(t => (t.Tipo, c.Categoria, t.Nome)))
        .ToDictionary(x => x.Tipo, x => (x.Categoria, x.Nome));

    public static bool Pertence(TipoOcorrencia tipo, Categoria categoria) =>
        PorTipo.TryGetValue(tipo, out var item) && item.Categoria == categoria;

    public static string NomeDoTipo(TipoOcorrencia tipo) => PorTipo[tipo].Nome;
}
