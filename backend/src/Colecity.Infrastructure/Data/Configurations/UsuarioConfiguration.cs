using Colecity.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Colecity.Infrastructure.Data.Configurations;

public class UsuarioConfiguration : IEntityTypeConfiguration<Usuario>
{
    public void Configure(EntityTypeBuilder<Usuario> builder)
    {
        builder.ToTable("Usuarios");
        builder.HasKey(u => u.Id);
        builder.Property(u => u.Id).ValueGeneratedNever();
        builder.Property(u => u.Nome).HasMaxLength(Usuario.TamanhoNome).IsRequired();
        builder.Property(u => u.Email).HasMaxLength(Usuario.TamanhoEmail).IsRequired();
        builder.Property(u => u.Bairro).HasMaxLength(Usuario.TamanhoBairro).IsRequired();
        builder.HasIndex(u => u.Email).IsUnique();
    }
}
