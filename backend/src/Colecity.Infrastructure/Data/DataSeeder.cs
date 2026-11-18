using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Colecity.Domain.Geo;
using Colecity.Domain.Servicos;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Data;

/// <summary>
/// Dados fictícios de demonstração (nenhum dado pessoal real). Tudo é criado pelas regras do domínio,
/// com datas no passado, para a linha do tempo, os marcos e o encerramento automático aparecerem.
/// </summary>
public static class DataSeeder
{
    public static async Task PopularAsync(ColecityDbContext db, DateTime agora, CancellationToken ct = default)
    {
        if (await db.Usuarios.AnyAsync(ct))
            return;

        string[] nomes =
        [
            "Ana Souza", "Bruno Lima", "Carla Mendes", "Diego Alves", "Eduarda Rocha", "Felipe Costa",
            "Gabriela Dias", "Henrique Martins", "Isabela Gomes", "João Pereira", "Larissa Ribeiro", "Marcos Santos"
        ];
        var u = nomes
            .Select(nome => Usuario.Cadastrar($"demo-{nome.Split(' ')[0].ToLowerInvariant()}", nome,
                $"{nome.Split(' ')[0].ToLowerInvariant()}@exemplo.com", "2026-11", agora.AddDays(-60)))
            .ToArray();
        var comentarios = new List<Comentario>();
        DateTime Dias(double dias) => agora.AddDays(-dias);

        var faltaAgua = Registrar(Categoria.Agua, TipoOcorrencia.FaltaAbastecimento,
            "Sem água desde ontem às 18h. A rua inteira está sem abastecimento.",
            new(-23.5512, -46.5998), new("Rua Taquari", "Mooca"), u[0], Dias(2), []);
        Participar(faltaAgua, TipoParticipacao.Afetado, Dias(1.8), u[1], u[2], u[3], u[4]);
        Participar(faltaAgua, TipoParticipacao.Apoio, Dias(1.5), u[5], u[6]);
        comentarios.Add(faltaAgua.Comentar(u[1], "Ainda sem água na altura do nº 300.", null, Dias(1)));
        comentarios.Add(faltaAgua.Comentar(u[0], "A Sabesp informou previsão para amanhã de manhã.", null, Dias(0.5)));

        var atraso8700 = Registrar(Categoria.Transporte, TipoOcorrencia.AtrasoIntervaloExcessivo,
            "O 8700 está passando com intervalo de mais de 40 minutos no fim da tarde.",
            new(-23.5250, -46.6950), new("Av. Francisco Matarazzo", "Água Branca"), u[1], Dias(3), [],
            new LinhaReferencia("8700-10", "Term. Campo Limpo – Pça. Ramos de Azevedo"));
        Participar(atraso8700, TipoParticipacao.Afetado, Dias(2), u[0], u[2], u[3], u[4], u[5], u[6], u[7], u[8], u[9], u[10]);
        Participar(atraso8700, TipoParticipacao.Apoio, Dias(1), u[11]);
        comentarios.Add(atraso8700.Comentar(u[2], "Hoje esperei 50 minutos no ponto da Pompeia.", null, Dias(0.8)));

        var buraco = Registrar(Categoria.Vias, TipoOcorrencia.Buraco,
            "Buraco grande ocupando metade da faixa, já causou queda de motociclista.",
            new(-23.7700, -46.6800), new("Av. Dona Belmira Marin", "Grajaú"), u[2], Dias(5), []);
        Participar(buraco, TipoParticipacao.Afetado, Dias(4), u[3]);
        Participar(buraco, TipoParticipacao.Apoio, Dias(4), u[4], u[5], u[6]);

        var faltaLuz = Registrar(Categoria.Energia, TipoOcorrencia.FaltaEnergia,
            "A luz cai quase todo dia no fim da tarde e demora horas para voltar.",
            new(-23.6680, -46.7790), new("Estrada de Itapecerica", "Capão Redondo"), u[3], Dias(1), []);
        Participar(faltaLuz, TipoParticipacao.Afetado, Dias(0.5), u[7], u[8]);

        var galho = Registrar(Categoria.Arvores, TipoOcorrencia.GalhoRiscoQueda,
            "Galho seco pendurado sobre a calçada em frente à escola.",
            new(-23.5617, -46.6820), new("Rua Cardeal Arcoverde", "Pinheiros"), u[4], Dias(10), []);
        Participar(galho, TipoParticipacao.Afetado, Dias(9), u[5]);
        galho.Concluir(u[4], "A subprefeitura fez a poda hoje de manhã.", null, Dias(3));

        // Cinco relatos de contas distintas a menos de 300 m formam uma Zona de atenção (RN-ZON-01).
        (double Lat, double Lng)[] pontosSe = [(-23.5503, -46.6339), (-23.5509, -46.6345), (-23.5498, -46.6331), (-23.5512, -46.6330), (-23.5500, -46.6348)];
        var relatosSeguranca = pontosSe
            .Select((p, i) => Registrar(Categoria.Seguranca, TipoOcorrencia.LocalMalIluminadoErmo,
                "Trecho sem iluminação à noite, pessoas evitam passar por aqui.",
                new(p.Lat, p.Lng), new("Praça da Sé", "Sé"), u[5 + i], Dias(1 + i * 2), []))
            .ToList();

        var deslizamento = Registrar(Categoria.RiscosInfraestrutura, TipoOcorrencia.RiscoDeslizamento,
            "Barranco cedendo atrás das casas depois das últimas chuvas.",
            new(-23.7050, -46.7700), new("Estrada do M'Boi Mirim", "Jardim Ângela"), u[5], Dias(4), []);
        Participar(deslizamento, TipoParticipacao.Afetado, Dias(3), u[6], u[7]);

        var alagamentoAntigo = Registrar(Categoria.Vias, TipoOcorrencia.Alagamento,
            "Rua alaga com qualquer chuva forte, a água entra nas garagens.",
            new(-23.5260, -46.7030), new("Rua Guaicurus", "Lapa"), u[6], Dias(45), []);
        alagamentoAntigo.EncerrarSeVencida(agora);

        Ocorrencia[] todas = [faltaAgua, atraso8700, buraco, faltaLuz, galho, deslizamento, alagamentoAntigo, .. relatosSeguranca];
        foreach (var ocorrencia in todas)
            ocorrencia.LimparEventosDominio();

        var zonas = CalculadoraZonasAtencao.Calcular(
            todas.Where(o => o.ContaParaZonaDeAtencao).Select(o => new RelatoGeolocalizado(o.Categoria, o.Localizacao, o.AutorId)),
            agora);

        db.Usuarios.AddRange(u);
        db.Ocorrencias.AddRange(todas);
        db.Comentarios.AddRange(comentarios);
        db.ZonasAtencao.AddRange(zonas);
        await db.SaveChangesAsync(ct);
    }

    private static Ocorrencia Registrar(Categoria categoria, TipoOcorrencia tipo, string descricao, Coordenada local,
        Endereco endereco, Usuario autor, DateTime em, string[] fotos, LinhaReferencia? linha = null) =>
        FabricaOcorrencias.Registrar(new NovaOcorrencia(categoria, tipo, descricao, local, endereco, autor, fotos, em, linha));

    private static void Participar(Ocorrencia ocorrencia, TipoParticipacao tipo, DateTime em, params Usuario[] usuarios)
    {
        foreach (var usuario in usuarios)
            ocorrencia.MarcarParticipacao(usuario, tipo, em);
    }
}
