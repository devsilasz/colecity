using Colecity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Colecity.Infrastructure.Data.Configurations;

public class ApoioConfiguration : IEntityTypeConfiguration<Apoio>
{
    public void Configure(EntityTypeBuilder<Apoio> builder)
    {
        builder.ToTable("Apoios");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Id).ValueGeneratedNever();
        builder.HasOne<Usuario>().WithMany().HasForeignKey(a => a.UsuarioId).OnDelete(DeleteBehavior.Restrict);

        // Garante no banco a regra de uma assinatura por usuário em cada abaixo-assinado.
        builder.HasIndex(a => new { a.OcorrenciaId, a.UsuarioId }).IsUnique();
    }
}

public class ComentarioConfiguration : IEntityTypeConfiguration<Comentario>
{
    public void Configure(EntityTypeBuilder<Comentario> builder)
    {
        builder.ToTable("Comentarios");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Texto).HasMaxLength(Comentario.TamanhoTexto).IsRequired();
        builder.HasOne<Usuario>().WithMany().HasForeignKey(c => c.UsuarioId).OnDelete(DeleteBehavior.Restrict);
    }
}
