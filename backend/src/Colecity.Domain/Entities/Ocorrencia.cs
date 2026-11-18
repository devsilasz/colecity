using Colecity.Domain.Enums;
using Colecity.Domain.Eventos;
using Colecity.Domain.Exceptions;
using Colecity.Domain.Geo;

namespace Colecity.Domain.Entities;

/// <summary>
/// Problema urbano relatado por um cidadão. Concentra as regras de registro, participação,
/// estados e linha do tempo (doc 07). Cada especialização define a política da sua categoria
/// (ciclo de acompanhamento, prazo de encerramento, reabertura, semelhantes e zona de atenção).
/// </summary>
public abstract class Ocorrencia : EntidadeBase, IConteudoModeravel
{
    public const int DescricaoMinima = 10;
    public const int DescricaoMaxima = 500;
    public const int FeedbackMaximo = 500;
    public const int TituloMaximo = 200;
    public const int AfetadosParaAcompanhamento = 3;
    public const string AvisoContagem = "Participações registradas no Colecity; não representam o total de afetados.";
    public static readonly TimeSpan PrazoReabertura = TimeSpan.FromDays(7);
    private static readonly int[] MarcosAfetados = [10, 50, 100];

    private readonly List<Participacao> _participacoes = [];
    private readonly List<Foto> _fotos = [];
    private readonly List<Foto> _fotosConclusao = [];
    private readonly List<EventoLinhaDoTempo> _eventos = [];
    private readonly List<IEventoDominio> _eventosDominio = [];

    public Categoria Categoria { get; private set; }
    public TipoOcorrencia Tipo { get; private set; }
    public string Titulo { get; private set; } = null!;
    public string Descricao { get; private set; } = null!;
    public Coordenada Localizacao { get; private set; } = null!;
    public string? Rua { get; private set; }
    public string? Bairro { get; private set; }

    /// <summary>A geocodificação falhou no registro e o título será completado depois.</summary>
    public bool EnderecoPendente { get; private set; }

    public Guid AutorId { get; private set; }
    public EstadoOcorrencia Estado { get; private set; }
    public int TotalAfetados { get; private set; }
    public int TotalApoios { get; private set; }
    public int UltimoMarcoAfetados { get; private set; }
    public DateTime UltimaAtividadeEm { get; private set; }
    public DateTime? ConcluidaEm { get; private set; }
    public MotivoConclusao? MotivoConclusao { get; private set; }
    public string? FeedbackConclusao { get; private set; }
    public bool Oculta { get; private set; }

    public IReadOnlyCollection<Participacao> Participacoes => _participacoes.AsReadOnly();
    public IReadOnlyCollection<Foto> Fotos => _fotos.AsReadOnly();
    public IReadOnlyCollection<Foto> FotosConclusao => _fotosConclusao.AsReadOnly();
    public IReadOnlyCollection<EventoLinhaDoTempo> Eventos => _eventos.AsReadOnly();
    public IReadOnlyCollection<IEventoDominio> EventosDominio => _eventosDominio.AsReadOnly();

    public Coordenada LocalizacaoAproximada => Localizacao.Aproximada();
    public bool Concluida => Estado == EstadoOcorrencia.Concluida;
    bool IConteudoModeravel.EstaOculto => Oculta;

    // ---- Política da categoria (sobrescrita pelas especializações) ----

    /// <summary>Passa a Em acompanhamento ao atingir 3 afetados (RN-ACO-02).</summary>
    protected virtual bool TemCicloDeAcompanhamento => true;

    /// <summary>Tempo sem atividade até o encerramento automático (RN-ACO-06).</summary>
    protected virtual TimeSpan PrazoInatividade => TimeSpan.FromDays(30);

    protected virtual string DescricaoEncerramentoAutomatico => "Concluída automaticamente por falta de atividade";

    public virtual bool PermiteReabertura => true;
    public virtual bool ExibeApoiadores => true;
    public virtual bool SugereSemelhantes => true;
    public virtual bool ContaParaZonaDeAtencao => false;
    public virtual DateTime PrazoEncerramentoAutomatico => UltimaAtividadeEm + PrazoInatividade;

    protected Ocorrencia() { }

    protected Ocorrencia(NovaOcorrencia dados)
    {
        if (!CatalogoCategorias.Pertence(dados.Tipo, dados.Categoria))
            throw new DomainException(CodigosErro.TipoInvalidoParaCategoria, "O tipo informado não pertence à categoria.", "tipo");
        if (!MunicipioSaoPaulo.Contem(dados.Localizacao))
            throw new DomainException(CodigosErro.LocalizacaoForaDoMunicipio,
                "Por enquanto o Colecity funciona apenas na cidade de São Paulo.", "localizacao");

        CriadoEm = dados.Agora;
        Categoria = dados.Categoria;
        Tipo = dados.Tipo;
        // Cópia própria: o EF não permite a mesma instância de tipo owned em duas entidades.
        Localizacao = dados.Localizacao with { };
        AutorId = dados.Autor.Id;
        Descricao = ValidarDescricao(dados.Descricao);
        _fotos.AddRange(Foto.CriarLista(dados.Fotos, dados.Autor));
        DefinirEndereco(dados.Endereco);
        Estado = EstadoOcorrencia.Aberta;
        UltimaAtividadeEm = dados.Agora;

        // O autor conta automaticamente como afetado (RN-REG-08).
        _participacoes.Add(new Participacao(Id, AutorId, TipoParticipacao.Afetado, dados.Agora));
        TotalAfetados = 1;
        RegistrarEvento(TipoEventoLinhaDoTempo.Criada, "Ocorrência registrada", dados.Agora);
    }

    public bool EhAutor(Guid usuarioId) => AutorId == usuarioId;

    public bool Participa(Guid usuarioId, TipoParticipacao tipo) =>
        _participacoes.Any(p => p.UsuarioId == usuarioId && p.Tipo == tipo);

    /// <summary>Título gerado "Tipo – Rua, Bairro" (RN-REG-07), com fallback quando a geocodificação falha.</summary>
    public void DefinirEndereco(Endereco? endereco)
    {
        Rua = Normalizar(endereco?.Rua);
        Bairro = Normalizar(endereco?.Bairro);
        EnderecoPendente = Rua is null && Bairro is null;

        var local = (Rua, Bairro) switch
        {
            ({ } rua, { } bairro) => $"{rua}, {bairro}",
            ({ } rua, null) => rua,
            (null, { } bairro) => bairro,
            _ => "Localização aproximada"
        };
        var titulo = $"{CatalogoCategorias.NomeDoTipo(Tipo)} – {local}";
        Titulo = titulo.Length <= TituloMaximo ? titulo : titulo[..TituloMaximo];
    }

    /// <summary>Somente descrição e fotos podem mudar, e só pelo autor (RN-REG-09).</summary>
    public void Editar(Usuario usuario, string? descricao, IReadOnlyCollection<string>? fotos)
    {
        GarantirAutor(usuario.Id);
        GarantirNaoConcluida();

        if (descricao is not null)
            Descricao = ValidarDescricao(descricao);
        if (fotos is not null)
        {
            // Fotos já da ocorrência continuam valendo mesmo em outra pasta (autoria transferida na
            // reabertura); só as novas precisam estar na pasta de quem edita.
            var mantidas = _fotos.Where(f => fotos.Contains(f.Path)).ToList();
            var novas = Foto.CriarLista(fotos.Where(p => mantidas.All(f => f.Path != p)).ToList(), usuario);
            if (mantidas.Count + novas.Count > Foto.MaximoPorRecurso)
                throw new DomainException(CodigosErro.LimiteFotosExcedido, $"Envie no máximo {Foto.MaximoPorRecurso} fotos.", "fotos");
            _fotos.RemoveAll(f => !mantidas.Contains(f));
            _fotos.AddRange(novas);
        }
    }

    /// <summary>Marca "afetado" ou "apoio". Idempotente (RN-PAR-02).</summary>
    public void MarcarParticipacao(Usuario usuario, TipoParticipacao tipo, DateTime agora)
    {
        GarantirNaoConcluida();
        if (tipo == TipoParticipacao.Apoio && EhAutor(usuario.Id))
            throw new DomainException(CodigosErro.AutorNaoPodeApoiar, "O autor não pode apoiar a própria ocorrência.");
        if (Participa(usuario.Id, tipo))
            return;

        _participacoes.Add(new Participacao(Id, usuario.Id, tipo, agora));
        RegistrarAtividade(agora);

        if (tipo == TipoParticipacao.Apoio)
        {
            TotalApoios++;
            return;
        }

        TotalAfetados++;
        RegistrarMarcoDeAfetados(agora);
        if (TemCicloDeAcompanhamento && Estado == EstadoOcorrencia.Aberta && TotalAfetados >= AfetadosParaAcompanhamento)
            AlterarEstado(EstadoOcorrencia.EmAcompanhamento, TipoEventoLinhaDoTempo.EstadoAlterado,
                $"Em acompanhamento: {TotalAfetados} pessoas afetadas", usuario.Id, agora);
    }

    /// <summary>
    /// Retira a participação (RN-PAR-04). Retirar o que não existe não é erro (RN-PAR-02):
    /// devolve <c>false</c> nesse caso.
    /// </summary>
    public bool RetirarParticipacao(Usuario usuario, TipoParticipacao tipo, DateTime agora)
    {
        GarantirNaoConcluida();
        if (tipo == TipoParticipacao.Afetado && EhAutor(usuario.Id))
            throw new DomainException(CodigosErro.AutorSempreAfetado, "O autor sempre conta como afetado.");

        var participacao = _participacoes.FirstOrDefault(p => p.UsuarioId == usuario.Id && p.Tipo == tipo);
        if (participacao is null)
            return false;

        Remover(participacao);
        RegistrarAtividade(agora);
        return true;
    }

    /// <summary>Conclusão pelo autor, com feedback opcional (RN-ACO-04, RN-ACO-05).</summary>
    public void Concluir(Usuario usuario, string? feedback, IReadOnlyCollection<string>? fotos, DateTime agora)
    {
        GarantirAutor(usuario.Id);
        GarantirNaoConcluida();

        var texto = string.IsNullOrWhiteSpace(feedback) ? null : feedback.Trim();
        if (texto is { Length: > FeedbackMaximo })
            throw new DomainException(CodigosErro.FeedbackTamanhoInvalido,
                $"O feedback deve ter no máximo {FeedbackMaximo} caracteres.", "feedback");

        _fotosConclusao.AddRange(Foto.CriarLista(fotos, usuario));
        FeedbackConclusao = texto;
        Finalizar(Enums.MotivoConclusao.Autor, "Concluída pelo autor", usuario.Id, agora);
    }

    /// <summary>Encerramento automático pela política da categoria (RN-ACO-06, RN-ACO-09).</summary>
    public bool EncerrarSeVencida(DateTime agora)
    {
        if (Concluida || agora < PrazoEncerramentoAutomatico)
            return false;

        Finalizar(Enums.MotivoConclusao.Inatividade, DescricaoEncerramentoAutomatico, autorAcaoId: null, agora);
        return true;
    }

    /// <summary>Qualquer afetado reabre em até 7 dias após a conclusão (RN-ACO-07).</summary>
    public void Reabrir(Usuario usuario, DateTime agora)
    {
        if (!PermiteReabertura)
            throw new DomainException(CodigosErro.ReaberturaNaoPermitida, "Relatos desta categoria não podem ser reabertos.");
        if (!Concluida)
            throw new ConflitoException(CodigosErro.OcorrenciaNaoConcluida, "A ocorrência não está concluída.");
        if (!Participa(usuario.Id, TipoParticipacao.Afetado))
            throw new AcessoNegadoException(CodigosErro.SomenteAfetado, "Apenas quem está afetado pode reabrir a ocorrência.");
        if (agora > ConcluidaEm + PrazoReabertura)
            throw new DomainException(CodigosErro.PrazoReaberturaExpirado, "O prazo de 7 dias para reabrir terminou.");

        ConcluidaEm = null;
        MotivoConclusao = null;
        FeedbackConclusao = null;
        _fotosConclusao.Clear();
        // Quem reabre passa a ser o autor (edita e conclui); o autor anterior segue como afetado
        // (decisão de 18/11/2026, RN-ACO-07).
        AutorId = usuario.Id;
        RegistrarAtividade(agora);
        AlterarEstado(EstadoOcorrencia.EmAcompanhamento, TipoEventoLinhaDoTempo.Reaberta,
            "Reaberta por uma pessoa afetada, que passa a acompanhar como autora", usuario.Id, agora);
    }

    /// <summary>Comentários só em ocorrências não concluídas (RN-COM-01, RN-ACO-08).</summary>
    public Comentario Comentar(Usuario usuario, string? texto, IReadOnlyCollection<string>? fotos, DateTime agora)
    {
        GarantirNaoConcluida();
        var comentario = new Comentario(Id, usuario, texto, fotos, agora);
        RegistrarAtividade(agora);
        _eventosDominio.Add(new ComentarioCriadoEvento(Id, Titulo, usuario.Id, agora));
        return comentario;
    }

    public bool PodeEditar(Guid? usuarioId) => usuarioId == AutorId && !Concluida;

    public bool PodeConcluir(Guid? usuarioId) => usuarioId == AutorId && !Concluida;

    public bool PodeReabrir(Guid? usuarioId, DateTime agora) =>
        PermiteReabertura && Concluida && usuarioId is { } id && Participa(id, TipoParticipacao.Afetado)
        && agora <= ConcluidaEm + PrazoReabertura;

    /// <summary>Anonimização (RN-CON-08): as participações da conta saem das contagens, inclusive a do autor.</summary>
    public void RemoverParticipacoesDe(Guid usuarioId)
    {
        foreach (var participacao in _participacoes.Where(p => p.UsuarioId == usuarioId).ToList())
            Remover(participacao);
    }

    public void Ocultar() => Oculta = true;

    public void Reexibir() => Oculta = false;

    public void LimparEventosDominio() => _eventosDominio.Clear();

    protected void GarantirNaoConcluida()
    {
        if (Concluida)
            throw new ConflitoException(CodigosErro.OcorrenciaConcluida, "A ocorrência já foi concluída.");
    }

    protected void RegistrarAtividade(DateTime agora) => UltimaAtividadeEm = agora;

    protected void RegistrarEvento(TipoEventoLinhaDoTempo tipo, string descricao, DateTime em,
        IReadOnlyList<Coordenada>? trecho = null) =>
        _eventos.Add(new EventoLinhaDoTempo(Id, tipo, descricao, em, trecho));

    protected void PublicarEvento(IEventoDominio evento) => _eventosDominio.Add(evento);

    private void Finalizar(MotivoConclusao motivo, string descricaoEvento, Guid? autorAcaoId, DateTime agora)
    {
        ConcluidaEm = agora;
        MotivoConclusao = motivo;
        AlterarEstado(EstadoOcorrencia.Concluida, TipoEventoLinhaDoTempo.Concluida, descricaoEvento, autorAcaoId, agora, motivo);
    }

    private void AlterarEstado(EstadoOcorrencia novo, TipoEventoLinhaDoTempo tipoEvento, string descricao,
        Guid? autorAcaoId, DateTime agora, MotivoConclusao? motivo = null)
    {
        Estado = novo;
        RegistrarEvento(tipoEvento, descricao, agora);
        _eventosDominio.Add(new EstadoAlteradoEvento(Id, Titulo, novo, motivo, autorAcaoId, agora));
    }

    private void RegistrarMarcoDeAfetados(DateTime agora)
    {
        var marco = MarcosAfetados.LastOrDefault(m => TotalAfetados >= m);
        if (marco <= UltimoMarcoAfetados)
            return;

        UltimoMarcoAfetados = marco;
        RegistrarEvento(TipoEventoLinhaDoTempo.MarcoAfetados, $"{marco} pessoas afetadas", agora);
    }

    private void Remover(Participacao participacao)
    {
        _participacoes.Remove(participacao);
        if (participacao.Tipo == TipoParticipacao.Afetado)
            TotalAfetados--;
        else
            TotalApoios--;
    }

    private void GarantirAutor(Guid usuarioId)
    {
        if (!EhAutor(usuarioId))
            throw new AcessoNegadoException(CodigosErro.SomenteAutor, "Apenas o autor pode fazer isso.");
    }

    private static string ValidarDescricao(string? descricao)
    {
        var texto = descricao?.Trim() ?? "";
        if (texto.Length is < DescricaoMinima or > DescricaoMaxima)
            throw new DomainException(CodigosErro.DescricaoTamanhoInvalido,
                $"A descrição deve ter entre {DescricaoMinima} e {DescricaoMaxima} caracteres.", "descricao");
        return texto;
    }

    private static string? Normalizar(string? texto) => string.IsNullOrWhiteSpace(texto) ? null : texto.Trim();
}
