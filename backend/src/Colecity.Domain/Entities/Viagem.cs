using Colecity.Domain.Enums;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>
/// "Estou neste ônibus" (RN-TAV-04 a 07): compartilhamento de posição por viagem, com expiração,
/// encerramento por parada fora do trajeto e detecção de desvio de rota.
/// </summary>
public class Viagem : EntidadeBase
{
    public static readonly TimeSpan Duracao = TimeSpan.FromHours(2);
    public static readonly TimeSpan TempoMaximoParadoForaDoTrajeto = TimeSpan.FromMinutes(10);
    public const double DistanciaDesvioMetros = 300;
    public const int PosicoesParaDesvio = 3;
    public const double RaioParadoMetros = 100;

    private readonly List<PosicaoViagem> _posicoes = [];

    public Guid UsuarioId { get; private set; }
    public string LinhaCodigo { get; private set; } = null!;
    public int Sentido { get; private set; }
    public DateTime ExpiraEm { get; private set; }
    public DateTime? EncerradaEm { get; private set; }
    public MotivoEncerramentoViagem? MotivoEncerramento { get; private set; }
    public DateTime? UltimaPosicaoEm { get; private set; }

    /// <summary>Trecho fora do trajeto aguardando a resposta "O ônibus mudou de rota?".</summary>
    public List<Coordenada>? TrechoDesvioPendente { get; private set; }

    /// <summary>Posições até este instante já foram avaliadas e não geram nova pergunta.</summary>
    public DateTime? DesvioAvaliadoAte { get; private set; }

    public IReadOnlyCollection<PosicaoViagem> Posicoes => _posicoes.AsReadOnly();

    private Viagem() { }

    public Viagem(Guid usuarioId, string linhaCodigo, int sentido, DateTime agora)
    {
        UsuarioId = usuarioId;
        LinhaCodigo = linhaCodigo;
        Sentido = sentido;
        CriadoEm = agora;
        ExpiraEm = agora + Duracao;
    }

    public bool EstaAtiva(DateTime agora) => EncerradaEm is null && agora < ExpiraEm;

    public void Encerrar(MotivoEncerramentoViagem motivo, DateTime agora)
    {
        if (EncerradaEm is not null)
            return;
        EncerradaEm = agora;
        MotivoEncerramento = motivo;
        TrechoDesvioPendente = null;
    }

    /// <summary>
    /// Registra a posição enviada a cada minuto. Mais de 300 m do trajeto em 3 posições seguidas
    /// (≈ 2 minutos) gera suspeita de desvio; 10 minutos parado fora do trajeto encerra a viagem.
    /// </summary>
    public ResultadoPosicao RegistrarPosicao(Coordenada posicao, DateTime registradaEm, double distanciaTrajetoMetros, DateTime agora)
    {
        if (!EstaAtiva(agora))
        {
            Encerrar(MotivoEncerramentoViagem.Expirada, agora);
            return ResultadoPosicao.Inativa;
        }

        _posicoes.Add(new PosicaoViagem(Id, posicao, registradaEm, distanciaTrajetoMetros));
        UltimaPosicaoEm = UltimaPosicaoEm is { } ultima && ultima > registradaEm ? ultima : registradaEm;

        var recentes = _posicoes.OrderByDescending(p => p.RegistradaEm).ToList();
        if (EstaParadaForaDoTrajeto(recentes))
        {
            Encerrar(MotivoEncerramentoViagem.ParadaForaDoTrajeto, agora);
            return ResultadoPosicao.Inativa;
        }

        var ultimas = recentes.Take(PosicoesParaDesvio).ToList();
        var desvio = ultimas.Count == PosicoesParaDesvio
                     && ultimas.All(p => p.ForaDoTrajeto && p.RegistradaEm > (DesvioAvaliadoAte ?? DateTime.MinValue));
        if (!desvio)
            return new ResultadoPosicao(true, false, null);

        TrechoDesvioPendente = ultimas.OrderBy(p => p.RegistradaEm).Select(p => p.Posicao).ToList();
        return new ResultadoPosicao(true, true, TrechoDesvioPendente);
    }

    /// <summary>Resposta à pergunta de desvio. Devolve o trecho quando confirmado.</summary>
    public IReadOnlyList<Coordenada>? ResponderDesvio(bool confirmado)
    {
        var trecho = TrechoDesvioPendente
            ?? throw new DomainException(CodigosErro.DesvioNaoDetectado, "Não há desvio aguardando confirmação nesta viagem.");

        TrechoDesvioPendente = null;
        DesvioAvaliadoAte = UltimaPosicaoEm;
        return confirmado ? trecho : null;
    }

    private static bool EstaParadaForaDoTrajeto(List<PosicaoViagem> recentes)
    {
        var ultima = recentes[0];
        var parada = recentes
            .TakeWhile(p => p.ForaDoTrajeto && p.Posicao.DistanciaMetros(ultima.Posicao) <= RaioParadoMetros)
            .ToList();
        return parada.Count > 0 && ultima.RegistradaEm - parada[^1].RegistradaEm >= TempoMaximoParadoForaDoTrajeto;
    }
}

public sealed record ResultadoPosicao(bool Ativa, bool DesvioSuspeito, IReadOnlyList<Coordenada>? TrechoDesvio)
{
    public static ResultadoPosicao Inativa { get; } = new(false, false, null);
}

/// <summary>Posição individual de passageiro. Apagada após 24 horas (RN-TAV-06).</summary>
public class PosicaoViagem : EntidadeBase
{
    public Guid ViagemId { get; private set; }
    public Coordenada Posicao { get; private set; } = null!;
    public DateTime RegistradaEm { get; private set; }
    public double DistanciaTrajetoMetros { get; private set; }
    public bool ForaDoTrajeto { get; private set; }

    private PosicaoViagem() { }

    internal PosicaoViagem(Guid viagemId, Coordenada posicao, DateTime registradaEm, double distanciaTrajetoMetros)
    {
        ViagemId = viagemId;
        Posicao = posicao with { };
        RegistradaEm = registradaEm;
        CriadoEm = registradaEm;
        DistanciaTrajetoMetros = distanciaTrajetoMetros;
        ForaDoTrajeto = distanciaTrajetoMetros > Viagem.DistanciaDesvioMetros;
    }
}
