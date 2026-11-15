using Colecity.Domain.Entities;
using Colecity.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Colecity.Infrastructure.Data.Configurations;

/// <summary>Mapeia a hierarquia de ocorrências em uma única tabela (TPH), discriminada pelo módulo.</summary>
public class OcorrenciaConfiguration : IEntityTypeConfiguration<Ocorrencia>
{
    public void Configure(EntityTypeBuilder<Ocorrencia> builder)
    {
        builder.ToTable("Ocorrencias");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Id).ValueGeneratedNever();

        builder.Property(o => o.Modulo).HasConversion<string>().HasMaxLength(20);
        builder.HasDiscriminator(o => o.Modulo)
            .HasValue<OcorrenciaTransporte>(Modulo.Transporte)
            .HasValue<OcorrenciaEnergia>(Modulo.Energia)
            .HasValue<OcorrenciaAgua>(Modulo.Agua)
            .HasValue<OcorrenciaVia>(Modulo.Vias);

        builder.Property(o => o.Titulo).HasMaxLength(Ocorrencia.TamanhoTitulo).IsRequired();
        builder.Property(o => o.Descricao).HasMaxLength(Ocorrencia.TamanhoDescricao).IsRequired();
        builder.Property(o => o.Bairro).HasMaxLength(Usuario.TamanhoBairro).IsRequired();
        builder.Property(o => o.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasOne<Usuario>().WithMany().HasForeignKey(o => o.AutorId).OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(o => o.Apoios).WithOne().HasForeignKey(a => a.OcorrenciaId).OnDelete(DeleteBehavior.Cascade);
        builder.HasMany(o => o.Comentarios).WithOne().HasForeignKey(c => c.OcorrenciaId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(o => o.Apoios).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.Navigation(o => o.Comentarios).UsePropertyAccessMode(PropertyAccessMode.Field);

        builder.HasIndex(o => new { o.Modulo, o.Status });
        builder.HasIndex(o => o.Bairro);
    }
}

public class OcorrenciaTransporteConfiguration : IEntityTypeConfiguration<OcorrenciaTransporte>
{
    public void Configure(EntityTypeBuilder<OcorrenciaTransporte> builder)
    {
        builder.Property(o => o.CodigoLinha).HasMaxLength(OcorrenciaTransporte.TamanhoCodigoLinha);
        builder.Property(o => o.TipoProblema).HasConversion<string>().HasMaxLength(20);
        builder.HasIndex(o => o.CodigoLinha);
    }
}

public class OcorrenciaViaConfiguration : IEntityTypeConfiguration<OcorrenciaVia>
{
    public void Configure(EntityTypeBuilder<OcorrenciaVia> builder) =>
        builder.Property(o => o.PontoReferencia).HasMaxLength(OcorrenciaVia.TamanhoPontoReferencia);
}
