using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace Colecity.Infrastructure.Data;

/// <summary>Popula o banco com dados fictícios para demonstração (nenhum dado pessoal real).</summary>
public static class DataSeeder
{
    public static async Task PopularAsync(ColecityDbContext db, CancellationToken ct = default)
    {
        if (await db.Usuarios.AnyAsync(ct))
            return;

        var nomes = new[]
        {
            ("Ana Souza", "Jardim Ângela"), ("José Lima", "Capão Redondo"), ("Marina Alves", "Grajaú"),
            ("Carlos Pereira", "Jardim Ângela"), ("Beatriz Rocha", "Jardim Ângela"), ("Rafael Costa", "Capão Redondo"),
            ("Juliana Martins", "Jardim São Luís"), ("Pedro Santos", "Jardim Ângela"), ("Larissa Gomes", "Grajaú"),
            ("Thiago Ribeiro", "Jardim São Luís"), ("Fernanda Dias", "Capão Redondo"), ("Lucas Ferreira", "Jardim Ângela")
        };
        var usuarios = nomes
            .Select((n, i) => new Usuario(n.Item1, $"usuario{i + 1}@exemplo.com", n.Item2))
            .ToList();
        var (ana, jose, marina) = (usuarios[0], usuarios[1], usuarios[2]);

        var linhaNaoPassa = new OcorrenciaTransporte(
            "Linha 6072-10 não passa depois das 22h",
            "O aplicativo mostra o horário, mas o ônibus não aparece. Já esperei mais de uma hora no ponto.",
            "Jardim Ângela", ana.Id, "6072-10", TipoProblemaTransporte.NaoPassou);
        ApoiarPor(linhaNaoPassa, usuarios.Skip(3));
        linhaNaoPassa.Comentar(usuarios[3].Id, "Aqui também, ontem esperei 50 minutos.");
        linhaNaoPassa.Comentar(usuarios[4].Id, "Quem estuda à noite está sempre chegando atrasado.");

        var lotacao = new OcorrenciaTransporte(
            "875A-10 lotado no horário de pico",
            "Entre 7h e 8h não é possível embarcar nos pontos depois de Perdizes.",
            "Perdizes", ana.Id, "875A-10", TipoProblemaTransporte.Lotacao);
        ApoiarPor(lotacao, usuarios.Skip(6).Take(3));

        var faltaLuz = new OcorrenciaEnergia(
            "Queda de energia recorrente na rua",
            "A luz cai quase todo dia no fim da tarde e demora horas para voltar.",
            "Capão Redondo", jose.Id, duracaoEstimadaHoras: 6);
        ApoiarPor(faltaLuz, [usuarios[5], usuarios[10], usuarios[0], usuarios[3]]);

        var faltaAgua = new OcorrenciaAgua(
            "Sem água desde ontem",
            "Rua inteira sem abastecimento desde a noite anterior.",
            "Jardim Ângela", marina.Id, duracaoEstimadaHoras: 12);
        ApoiarPor(faltaAgua, [usuarios[7]]);

        var buraco = new OcorrenciaVia(
            "Buraco grande na avenida",
            "Buraco ocupa metade da faixa e já causou acidente com moto.",
            "Grajaú", marina.Id, "Av. Dona Belmira Marin, perto do terminal");
        ApoiarPor(buraco, [usuarios[8], usuarios[1]]);

        var buracoResolvido = new OcorrenciaVia(
            "Buraco na calçada em frente à escola",
            "Crianças tropeçam na saída da escola.",
            "Jardim São Luís", usuarios[6].Id, "Rua da escola estadual");
        ApoiarPor(buracoResolvido, [usuarios[9]]);
        buracoResolvido.ConfirmarResolucao(usuarios[9].Id, DateTime.UtcNow);

        db.Usuarios.AddRange(usuarios);
        db.Ocorrencias.AddRange(linhaNaoPassa, lotacao, faltaLuz, faltaAgua, buraco, buracoResolvido);
        await db.SaveChangesAsync(ct);
    }

    private static void ApoiarPor(Ocorrencia ocorrencia, IEnumerable<Usuario> apoiadores)
    {
        foreach (var usuario in apoiadores)
            ocorrencia.Apoiar(usuario.Id);
    }
}
