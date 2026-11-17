using Colecity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Colecity.Infrastructure.Data.Configurations;

/// <summary>Hierarquia de ocorrências em uma tabela (TPH), discriminada pela especialização.</summary>
public class OcorrenciaConfiguration : IEntityTypeConfiguration<Ocorrencia>
{
    public void Configure(EntityTypeBuilder<Ocorrencia> builder)
    {
        builder.ToTable("Ocorrencias");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();

        builder.HasDiscriminator<string>("Especie")
            .HasValue<OcorrenciaTransporte>("TRANSPORTE")
            .HasValue<OcorrenciaSeguranca>("SEGURANCA")
            .HasValue<OcorrenciaServicoEssencial>("SERVICO_ESSENCIAL")
            .HasValue<OcorrenciaGeral>("GERAL");
        builder.Property<string>("Especie").HasMaxLength(20);

        builder.Property(o => o.Categoria).HasConversion<string>().HasMaxLength(30);
        builder.Property(o => o.Tipo).HasConversion<string>().HasMaxLength(40);
        builder.Property(o => o.Estado).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.MotivoConclusao).HasConversion<string>().HasMaxLength(20);
        builder.Property(o => o.Titulo).HasMaxLength(Ocorrencia.TituloMaximo).IsRequired();
        builder.Property(o => o.Descricao).HasMaxLength(Ocorrencia.DescricaoMaxima).IsRequired();
        builder.Property(o => o.Rua).HasMaxLength(150);
        builder.Property(o => o.Bairro).HasMaxLength(100);
        builder.Property(o => o.FeedbackConclusao).HasMaxLength(Ocorrencia.FeedbackMaximo);

        builder.OwnsOne(o => o.Localizacao, local =>
        {
            local.Property(c => c.Lat).HasColumnName("Lat");
            local.Property(c => c.Lng).HasColumnName("Lng");
            local.HasIndex(c => new { c.Lat, c.Lng });
        });
        builder.Navigation(o => o.Localizacao).IsRequired();

        builder.OwnsMany(o => o.Fotos, fotos => ConfigurarFotos(fotos, "OcorrenciaFotos", "OcorrenciaId"));
        builder.OwnsMany(o => o.FotosConclusao, fotos => ConfigurarFotos(fotos, "OcorrenciaFotosConclusao", "OcorrenciaId"));

        builder.HasOne<Usuario>().WithMany().HasForeignKey(o => o.AutorId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(o => o.Participacoes).WithOne().HasForeignKey(p => p.OcorrenciaId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(o => o.Eventos).WithOne().HasForeignKey(e => e.OcorrenciaId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(o => o.Participacoes).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(o => o.Eventos).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.Ignore(o => o.EventosDominio);
        builder.Ignore(o => o.LocalizacaoAproximada);

        builder.HasIndex(o => new { o.Estado, o.Categoria });
        builder.HasIndex(o => o.UltimaAtividadeEm);
    }

    internal static void ConfigurarFotos<TDono>(OwnedNavigationBuilder<TDono, Foto> fotos, string tabela, string chaveDono)
        where TDono : class
    {
        fotos.ToTable(tabela);
        fotos.WithOwner().HasForeignKey(chaveDono);
        fotos.HasKey(f => f.Id);
        fotos.Property(f => f.Id).ValueGeneratedNever();
        fotos.Property(f => f.Path).HasMaxLength(Foto.PathMaximo).IsRequired();
        fotos.UsePropertyAccessMode(PropertyAccessMode.Field);
    }
}

public class OcorrenciaTransporteConfiguration : IEntityTypeConfiguration<OcorrenciaTransporte>
{
    public void Configure(EntityTypeBuilder<OcorrenciaTransporte> builder)
    {
        builder.Property(o => o.LinhaCodigo).HasMaxLength(OcorrenciaTransporte.CodigoLinhaMaximo);
        builder.Property(o => o.LinhaNome).HasMaxLength(OcorrenciaTransporte.NomeLinhaMaximo);
        builder.HasIndex(o => o.LinhaCodigo);
    }
}

public class ParticipacaoConfiguration : IEntityTypeConfiguration<Participacao>
{
    public void Configure(EntityTypeBuilder<Participacao> builder)
    {
        builder.ToTable("Participacoes");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.Property(p => p.Tipo).HasConversion<string>().HasMaxLength(20);
        builder.HasOne<Usuario>().WithMany().HasForeignKey(p => p.UsuarioId).OnDelete(DeleteBehavior.Restrict);

        // Uma marcação de cada tipo por conta (RN-PAR-02), garantida também no banco.
        builder.HasIndex(p => new { p.OcorrenciaId, p.UsuarioId, p.Tipo }).IsUnique();
        builder.HasIndex(p => new { p.UsuarioId, p.Tipo });
    }
}

public class EventoLinhaDoTempoConfiguration : IEntityTypeConfiguration<EventoLinhaDoTempo>
{
    public void Configure(EntityTypeBuilder<EventoLinhaDoTempo> builder)
    {
        builder.ToTable("EventosLinhaDoTempo");
        builder.HasKey(e => e.Id);
        builder.Property(e => e.Id).ValueGeneratedNever();
        builder.Property(e => e.Tipo).HasConversion<string>().HasMaxLength(30);
        builder.Property(e => e.Descricao).HasMaxLength(EventoLinhaDoTempo.DescricaoMaxima).IsRequired();
        builder.Property(e => e.Trecho).ComoJson();
        builder.HasIndex(e => new { e.OcorrenciaId, e.CriadoEm });
    }
}
