using Colecity.Domain.Entities;
using Colecity.Infrastructure.Eventos;
using Colecity.Infrastructure.Idempotencia;
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
        builder.Property(u => u.Uid).HasMaxLength(Usuario.UidMaximo);
        builder.Property(u => u.Nome).HasMaxLength(Usuario.NomeMaximo);
        builder.Property(u => u.Email).HasMaxLength(Usuario.EmailMaximo);
        builder.Property(u => u.AceiteTermosVersao).HasMaxLength(Usuario.VersaoTermosMaxima);

        // Depois da anonimização, uid e e-mail ficam nulos e deixam de ser reconhecidos.
        builder.HasIndex(u => u.Uid).IsUnique();
        builder.HasIndex(u => u.Email).IsUnique();
    }
}

public class ComentarioConfiguration : IEntityTypeConfiguration<Comentario>
{
    public void Configure(EntityTypeBuilder<Comentario> builder)
    {
        builder.ToTable("Comentarios");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Id).ValueGeneratedNever();
        builder.Property(c => c.Texto).HasMaxLength(Comentario.TextoMaximo).IsRequired();
        builder.HasOne<Ocorrencia>().WithMany().HasForeignKey(c => c.OcorrenciaId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne<Usuario>().WithMany().HasForeignKey(c => c.AutorId).OnDelete(DeleteBehavior.Restrict);
        builder.OwnsMany(c => c.Fotos, fotos => OcorrenciaConfiguration.ConfigurarFotos(fotos, "ComentarioFotos", "ComentarioId"));
        builder.HasIndex(c => new { c.OcorrenciaId, c.CriadoEm });
    }
}

public class DenunciaConfiguration : IEntityTypeConfiguration<Denuncia>
{
    public void Configure(EntityTypeBuilder<Denuncia> builder)
    {
        builder.ToTable("Denuncias");
        builder.HasKey(d => d.Id);
        builder.Property(d => d.Id).ValueGeneratedNever();
        builder.Property(d => d.TipoConteudo).HasConversion<string>().HasMaxLength(20);
        builder.Property(d => d.Motivo).HasConversion<string>().HasMaxLength(20);
        builder.HasOne<Usuario>().WithMany().HasForeignKey(d => d.UsuarioId).OnDelete(DeleteBehavior.Restrict);

        // Uma denúncia por conta por conteúdo (RN-MOD-01).
        builder.HasIndex(d => new { d.TipoConteudo, d.ConteudoId, d.UsuarioId }).IsUnique();
        builder.HasIndex(d => d.Revisada);
    }
}

public class ZonaAtencaoConfiguration : IEntityTypeConfiguration<ZonaAtencao>
{
    public void Configure(EntityTypeBuilder<ZonaAtencao> builder)
    {
        builder.ToTable("ZonasAtencao");
        builder.HasKey(z => z.Id);
        builder.Property(z => z.Id).ValueGeneratedNever();
        builder.Property(z => z.Categoria).HasConversion<string>().HasMaxLength(30);
        builder.OwnsOne(z => z.Centro, centro =>
        {
            centro.Property(c => c.Lat).HasColumnName("CentroLat");
            centro.Property(c => c.Lng).HasColumnName("CentroLng");
        });
        builder.Navigation(z => z.Centro).IsRequired();
    }
}

public class LinhaOnibusConfiguration : IEntityTypeConfiguration<LinhaOnibus>
{
    public void Configure(EntityTypeBuilder<LinhaOnibus> builder)
    {
        builder.ToTable("GtfsLinhas");
        builder.HasKey(l => l.Codigo);
        builder.Property(l => l.Codigo).HasMaxLength(LinhaOnibus.CodigoMaximo);
        builder.Property(l => l.Nome).HasMaxLength(LinhaOnibus.NomeMaximo).IsRequired();
        builder.HasMany(l => l.Sentidos).WithOne().HasForeignKey(s => s.LinhaCodigo).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(l => l.Sentidos).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasIndex(l => l.Nome);
    }
}

public class SentidoLinhaConfiguration : IEntityTypeConfiguration<SentidoLinha>
{
    public void Configure(EntityTypeBuilder<SentidoLinha> builder)
    {
        builder.ToTable("GtfsSentidos");
        builder.HasKey(s => new { s.LinhaCodigo, s.Sentido });
        builder.Property(s => s.Destino).HasMaxLength(LinhaOnibus.NomeMaximo).IsRequired();
        builder.Property(s => s.ShapeId).HasMaxLength(50).IsRequired();
    }
}

public class PontoTrajetoConfiguration : IEntityTypeConfiguration<PontoTrajeto>
{
    public void Configure(EntityTypeBuilder<PontoTrajeto> builder)
    {
        builder.ToTable("GtfsPontosTrajeto");
        builder.HasKey(p => new { p.ShapeId, p.Sequencia });
        builder.Property(p => p.ShapeId).HasMaxLength(50);
    }
}

public class ViagemConfiguration : IEntityTypeConfiguration<Viagem>
{
    public void Configure(EntityTypeBuilder<Viagem> builder)
    {
        builder.ToTable("Viagens");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.Id).ValueGeneratedNever();
        builder.Property(v => v.LinhaCodigo).HasMaxLength(LinhaOnibus.CodigoMaximo).IsRequired();
        builder.Property(v => v.MotivoEncerramento).HasConversion<string>().HasMaxLength(30);
        builder.Property(v => v.TrechoDesvioPendente).ComoJson();
        builder.HasOne<Usuario>().WithMany().HasForeignKey(v => v.UsuarioId).OnDelete(DeleteBehavior.Restrict);
        builder.HasMany(v => v.Posicoes).WithOne().HasForeignKey(p => p.ViagemId).OnDelete(DeleteBehavior.Cascade);
        builder.Navigation(v => v.Posicoes).UsePropertyAccessMode(PropertyAccessMode.Field);
        builder.HasIndex(v => new { v.UsuarioId, v.EncerradaEm });
        builder.HasIndex(v => new { v.LinhaCodigo, v.Sentido, v.EncerradaEm });
    }
}

public class PosicaoViagemConfiguration : IEntityTypeConfiguration<PosicaoViagem>
{
    public void Configure(EntityTypeBuilder<PosicaoViagem> builder)
    {
        builder.ToTable("PosicoesViagem");
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Id).ValueGeneratedNever();
        builder.OwnsOne(p => p.Posicao, posicao =>
        {
            posicao.Property(c => c.Lat).HasColumnName("Lat");
            posicao.Property(c => c.Lng).HasColumnName("Lng");
        });
        builder.Navigation(p => p.Posicao).IsRequired();
        builder.HasIndex(p => new { p.ViagemId, p.RegistradaEm });
        builder.HasIndex(p => p.RegistradaEm);
    }
}

public class MensagemOutboxConfiguration : IEntityTypeConfiguration<MensagemOutbox>
{
    public void Configure(EntityTypeBuilder<MensagemOutbox> builder)
    {
        builder.ToTable("OutboxEventos");
        builder.HasKey(m => m.Id);
        builder.Property(m => m.Id).ValueGeneratedNever();
        builder.Property(m => m.Tipo).HasMaxLength(60).IsRequired();
        builder.Property(m => m.Payload).IsRequired();
        builder.HasIndex(m => new { m.ProcessadaEm, m.Falhou, m.ProximaTentativaEm });
    }
}

public class RegistroIdempotenciaConfiguration : IEntityTypeConfiguration<RegistroIdempotencia>
{
    public void Configure(EntityTypeBuilder<RegistroIdempotencia> builder)
    {
        builder.ToTable("RegistrosIdempotencia");
        builder.HasKey(r => r.Id);
        builder.Property(r => r.Id).ValueGeneratedNever();
        builder.Property(r => r.Rota).HasMaxLength(RegistroIdempotencia.RotaMaxima).IsRequired();
        builder.Property(r => r.Chave).HasMaxLength(RegistroIdempotencia.ChaveMaxima).IsRequired();
        builder.Property(r => r.Corpo).IsRequired();
        builder.HasIndex(r => new { r.UsuarioId, r.Rota, r.Chave }).IsUnique();
        builder.HasIndex(r => r.CriadoEm);
    }
}
