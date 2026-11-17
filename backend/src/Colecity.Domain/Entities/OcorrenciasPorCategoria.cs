using Colecity.Domain.Enums;
using Colecity.Domain.Eventos;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>Transporte: pode citar a linha e receber desvios confirmados por passageiros (RN-TAV-07).</summary>
public class OcorrenciaTransporte : Ocorrencia
{
    public const int CodigoLinhaMaximo = 20;
    public const int NomeLinhaMaximo = 120;

    public string? LinhaCodigo { get; private set; }
    public string? LinhaNome { get; private set; }

    private OcorrenciaTransporte() { }

    internal OcorrenciaTransporte(NovaOcorrencia dados) : base(dados)
    {
        LinhaCodigo = dados.Linha?.Codigo;
        LinhaNome = dados.Linha?.Nome;
    }

    /// <summary>Cria ou reforça o relato de desvio: o passageiro vira afetado e o trecho entra na linha do tempo.</summary>
    public void RegistrarDesvio(Usuario passageiro, IReadOnlyList<Coordenada> trecho, DateTime agora)
    {
        MarcarParticipacao(passageiro, TipoParticipacao.Afetado, agora);
        RegistrarEvento(TipoEventoLinhaDoTempo.DesvioDetectado, "Desvio de rota confirmado por passageiros", agora, trecho);
        RegistrarAtividade(agora);
        PublicarEvento(new DesvioConfirmadoEvento(Id, Titulo, LinhaCodigo ?? "", passageiro.Id, agora));
    }
}

/// <summary>
/// Segurança: cada relato é um fato distinto. Sem ciclo de acompanhamento, sem reabertura,
/// sem lista de apoiadores e sem semelhantes; conclui sozinho após 30 dias (RN-ACO-09, RN-SEM-04, RN-PAR-07).
/// </summary>
public class OcorrenciaSeguranca : Ocorrencia
{
    public static readonly TimeSpan JanelaDoRelato = TimeSpan.FromDays(30);
    private static readonly TimeSpan ToleranciaRelogio = TimeSpan.FromMinutes(5);

    public DateTime DataHoraOcorrido { get; private set; }

    private OcorrenciaSeguranca() { }

    internal OcorrenciaSeguranca(NovaOcorrencia dados) : base(dados)
    {
        var ocorrido = dados.DataHoraOcorrido ?? dados.Agora;
        if (ocorrido > dados.Agora + ToleranciaRelogio || ocorrido < dados.Agora - JanelaDoRelato)
            throw new DomainException(CodigosErro.DataOcorridoInvalida,
                "A data e hora do ocorrido não pode ser futura nem anterior a 30 dias.", "dataHoraOcorrido");
        DataHoraOcorrido = ocorrido;
    }

    protected override bool TemCicloDeAcompanhamento => false;
    protected override string DescricaoEncerramentoAutomatico => "Relato de segurança concluído após 30 dias";
    public override bool PermiteReabertura => false;
    public override bool ExibeApoiadores => false;
    public override bool SugereSemelhantes => false;
    public override bool ContaParaZonaDeAtencao => true;
    public override DateTime PrazoEncerramentoAutomatico => CriadoEm + JanelaDoRelato;
}

/// <summary>Água e Energia: serviços essenciais, encerram após 7 dias sem atividade (RN-ACO-06).</summary>
public class OcorrenciaServicoEssencial : Ocorrencia
{
    private OcorrenciaServicoEssencial() { }

    internal OcorrenciaServicoEssencial(NovaOcorrencia dados) : base(dados) { }

    protected override TimeSpan PrazoInatividade => TimeSpan.FromDays(7);
}

/// <summary>Vias, Árvores e Riscos e infraestrutura. Riscos também alimenta a Zona de atenção (RN-ZON-01).</summary>
public class OcorrenciaGeral : Ocorrencia
{
    private OcorrenciaGeral() { }

    internal OcorrenciaGeral(NovaOcorrencia dados) : base(dados) { }

    public override bool ContaParaZonaDeAtencao => Categoria == Categoria.RiscosInfraestrutura;
}

/// <summary>Escolhe a especialização correta para a categoria.</summary>
public static class FabricaOcorrencias
{
    public static Ocorrencia Registrar(NovaOcorrencia dados)
    {
        if (dados.Linha is not null && dados.Categoria != Categoria.Transporte)
            throw new DomainException(CodigosErro.LinhaInvalida, "A linha só pode ser informada em ocorrências de Transporte.", "linha");
        if (dados.DataHoraOcorrido is not null && dados.Categoria != Categoria.Seguranca)
            throw new DomainException(CodigosErro.DataOcorridoInvalida,
                "A data e hora do ocorrido só pode ser informada em Segurança.", "dataHoraOcorrido");

        return dados.Categoria switch
        {
            Categoria.Transporte => new OcorrenciaTransporte(dados),
            Categoria.Seguranca => new OcorrenciaSeguranca(dados),
            Categoria.Agua or Categoria.Energia => new OcorrenciaServicoEssencial(dados),
            _ => new OcorrenciaGeral(dados)
        };
    }
}
