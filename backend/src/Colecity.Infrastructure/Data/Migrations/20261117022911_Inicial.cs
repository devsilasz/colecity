using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Colecity.Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class Inicial : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GtfsLinhas",
                columns: table => new
                {
                    Codigo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GtfsLinhas", x => x.Codigo);
                });

            migrationBuilder.CreateTable(
                name: "GtfsPontosTrajeto",
                columns: table => new
                {
                    ShapeId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false),
                    Sequencia = table.Column<int>(type: "INTEGER", nullable: false),
                    Lat = table.Column<double>(type: "REAL", nullable: false),
                    Lng = table.Column<double>(type: "REAL", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GtfsPontosTrajeto", x => new { x.ShapeId, x.Sequencia });
                });

            migrationBuilder.CreateTable(
                name: "OutboxEventos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 60, nullable: false),
                    Payload = table.Column<string>(type: "TEXT", nullable: false),
                    OcorridoEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    Tentativas = table.Column<int>(type: "INTEGER", nullable: false),
                    ProximaTentativaEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ProcessadaEm = table.Column<DateTime>(type: "TEXT", nullable: true),
                    Falhou = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OutboxEventos", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "RegistrosIdempotencia",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Rota = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Chave = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    StatusCode = table.Column<int>(type: "INTEGER", nullable: false),
                    Corpo = table.Column<string>(type: "TEXT", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RegistrosIdempotencia", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Usuarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Uid = table.Column<string>(type: "TEXT", maxLength: 128, nullable: true),
                    Nome = table.Column<string>(type: "TEXT", maxLength: 80, nullable: true),
                    Email = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    AceiteTermosVersao = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    Removido = table.Column<bool>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Usuarios", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "ZonasAtencao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    CentroLat = table.Column<double>(type: "REAL", nullable: false),
                    CentroLng = table.Column<double>(type: "REAL", nullable: false),
                    RaioMetros = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalRelatos = table.Column<int>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ZonasAtencao", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GtfsSentidos",
                columns: table => new
                {
                    LinhaCodigo = table.Column<string>(type: "TEXT", nullable: false),
                    Sentido = table.Column<int>(type: "INTEGER", nullable: false),
                    Destino = table.Column<string>(type: "TEXT", maxLength: 120, nullable: false),
                    ShapeId = table.Column<string>(type: "TEXT", maxLength: 50, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GtfsSentidos", x => new { x.LinhaCodigo, x.Sentido });
                    table.ForeignKey(
                        name: "FK_GtfsSentidos_GtfsLinhas_LinhaCodigo",
                        column: x => x.LinhaCodigo,
                        principalTable: "GtfsLinhas",
                        principalColumn: "Codigo",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Denuncias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    TipoConteudo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ConteudoId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Motivo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Revisada = table.Column<bool>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Denuncias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Denuncias_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Ocorrencias",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Categoria = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 40, nullable: false),
                    Titulo = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Lat = table.Column<double>(type: "REAL", nullable: false),
                    Lng = table.Column<double>(type: "REAL", nullable: false),
                    Rua = table.Column<string>(type: "TEXT", maxLength: 150, nullable: true),
                    Bairro = table.Column<string>(type: "TEXT", maxLength: 100, nullable: true),
                    EnderecoPendente = table.Column<bool>(type: "INTEGER", nullable: false),
                    AutorId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Estado = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    TotalAfetados = table.Column<int>(type: "INTEGER", nullable: false),
                    TotalApoios = table.Column<int>(type: "INTEGER", nullable: false),
                    UltimoMarcoAfetados = table.Column<int>(type: "INTEGER", nullable: false),
                    UltimaAtividadeEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ConcluidaEm = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MotivoConclusao = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    FeedbackConclusao = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    Oculta = table.Column<bool>(type: "INTEGER", nullable: false),
                    Especie = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    DataHoraOcorrido = table.Column<DateTime>(type: "TEXT", nullable: true),
                    LinhaCodigo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: true),
                    LinhaNome = table.Column<string>(type: "TEXT", maxLength: 120, nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ocorrencias", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ocorrencias_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Viagens",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    LinhaCodigo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Sentido = table.Column<int>(type: "INTEGER", nullable: false),
                    ExpiraEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    EncerradaEm = table.Column<DateTime>(type: "TEXT", nullable: true),
                    MotivoEncerramento = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    UltimaPosicaoEm = table.Column<DateTime>(type: "TEXT", nullable: true),
                    TrechoDesvioPendente = table.Column<string>(type: "TEXT", nullable: true),
                    DesvioAvaliadoAte = table.Column<DateTime>(type: "TEXT", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Viagens", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Viagens_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Comentarios",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OcorrenciaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AutorId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Texto = table.Column<string>(type: "TEXT", maxLength: 500, nullable: false),
                    Oculto = table.Column<bool>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Comentarios", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Comentarios_Ocorrencias_OcorrenciaId",
                        column: x => x.OcorrenciaId,
                        principalTable: "Ocorrencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Comentarios_Usuarios_AutorId",
                        column: x => x.AutorId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "EventosLinhaDoTempo",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OcorrenciaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    Descricao = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Trecho = table.Column<string>(type: "TEXT", nullable: true),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_EventosLinhaDoTempo", x => x.Id);
                    table.ForeignKey(
                        name: "FK_EventosLinhaDoTempo_Ocorrencias_OcorrenciaId",
                        column: x => x.OcorrenciaId,
                        principalTable: "Ocorrencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OcorrenciaFotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Oculta = table.Column<bool>(type: "INTEGER", nullable: false),
                    OcorrenciaId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OcorrenciaFotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OcorrenciaFotos_Ocorrencias_OcorrenciaId",
                        column: x => x.OcorrenciaId,
                        principalTable: "Ocorrencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "OcorrenciaFotosConclusao",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Oculta = table.Column<bool>(type: "INTEGER", nullable: false),
                    OcorrenciaId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_OcorrenciaFotosConclusao", x => x.Id);
                    table.ForeignKey(
                        name: "FK_OcorrenciaFotosConclusao_Ocorrencias_OcorrenciaId",
                        column: x => x.OcorrenciaId,
                        principalTable: "Ocorrencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Participacoes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OcorrenciaId = table.Column<Guid>(type: "TEXT", nullable: false),
                    UsuarioId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Tipo = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Participacoes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Participacoes_Ocorrencias_OcorrenciaId",
                        column: x => x.OcorrenciaId,
                        principalTable: "Ocorrencias",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Participacoes_Usuarios_UsuarioId",
                        column: x => x.UsuarioId,
                        principalTable: "Usuarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PosicoesViagem",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ViagemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Lat = table.Column<double>(type: "REAL", nullable: false),
                    Lng = table.Column<double>(type: "REAL", nullable: false),
                    RegistradaEm = table.Column<DateTime>(type: "TEXT", nullable: false),
                    DistanciaTrajetoMetros = table.Column<double>(type: "REAL", nullable: false),
                    ForaDoTrajeto = table.Column<bool>(type: "INTEGER", nullable: false),
                    CriadoEm = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PosicoesViagem", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PosicoesViagem_Viagens_ViagemId",
                        column: x => x.ViagemId,
                        principalTable: "Viagens",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ComentarioFotos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    Path = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    Oculta = table.Column<bool>(type: "INTEGER", nullable: false),
                    ComentarioId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComentarioFotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ComentarioFotos_Comentarios_ComentarioId",
                        column: x => x.ComentarioId,
                        principalTable: "Comentarios",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ComentarioFotos_ComentarioId",
                table: "ComentarioFotos",
                column: "ComentarioId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_AutorId",
                table: "Comentarios",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_Comentarios_OcorrenciaId_CriadoEm",
                table: "Comentarios",
                columns: new[] { "OcorrenciaId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_Revisada",
                table: "Denuncias",
                column: "Revisada");

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_TipoConteudo_ConteudoId_UsuarioId",
                table: "Denuncias",
                columns: new[] { "TipoConteudo", "ConteudoId", "UsuarioId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Denuncias_UsuarioId",
                table: "Denuncias",
                column: "UsuarioId");

            migrationBuilder.CreateIndex(
                name: "IX_EventosLinhaDoTempo_OcorrenciaId_CriadoEm",
                table: "EventosLinhaDoTempo",
                columns: new[] { "OcorrenciaId", "CriadoEm" });

            migrationBuilder.CreateIndex(
                name: "IX_GtfsLinhas_Nome",
                table: "GtfsLinhas",
                column: "Nome");

            migrationBuilder.CreateIndex(
                name: "IX_OcorrenciaFotos_OcorrenciaId",
                table: "OcorrenciaFotos",
                column: "OcorrenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_OcorrenciaFotosConclusao_OcorrenciaId",
                table: "OcorrenciaFotosConclusao",
                column: "OcorrenciaId");

            migrationBuilder.CreateIndex(
                name: "IX_Ocorrencias_AutorId",
                table: "Ocorrencias",
                column: "AutorId");

            migrationBuilder.CreateIndex(
                name: "IX_Ocorrencias_Estado_Categoria",
                table: "Ocorrencias",
                columns: new[] { "Estado", "Categoria" });

            migrationBuilder.CreateIndex(
                name: "IX_Ocorrencias_Lat_Lng",
                table: "Ocorrencias",
                columns: new[] { "Lat", "Lng" });

            migrationBuilder.CreateIndex(
                name: "IX_Ocorrencias_LinhaCodigo",
                table: "Ocorrencias",
                column: "LinhaCodigo");

            migrationBuilder.CreateIndex(
                name: "IX_Ocorrencias_UltimaAtividadeEm",
                table: "Ocorrencias",
                column: "UltimaAtividadeEm");

            migrationBuilder.CreateIndex(
                name: "IX_OutboxEventos_ProcessadaEm_Falhou_ProximaTentativaEm",
                table: "OutboxEventos",
                columns: new[] { "ProcessadaEm", "Falhou", "ProximaTentativaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Participacoes_OcorrenciaId_UsuarioId_Tipo",
                table: "Participacoes",
                columns: new[] { "OcorrenciaId", "UsuarioId", "Tipo" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Participacoes_UsuarioId_Tipo",
                table: "Participacoes",
                columns: new[] { "UsuarioId", "Tipo" });

            migrationBuilder.CreateIndex(
                name: "IX_PosicoesViagem_RegistradaEm",
                table: "PosicoesViagem",
                column: "RegistradaEm");

            migrationBuilder.CreateIndex(
                name: "IX_PosicoesViagem_ViagemId_RegistradaEm",
                table: "PosicoesViagem",
                columns: new[] { "ViagemId", "RegistradaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosIdempotencia_CriadoEm",
                table: "RegistrosIdempotencia",
                column: "CriadoEm");

            migrationBuilder.CreateIndex(
                name: "IX_RegistrosIdempotencia_UsuarioId_Rota_Chave",
                table: "RegistrosIdempotencia",
                columns: new[] { "UsuarioId", "Rota", "Chave" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Email",
                table: "Usuarios",
                column: "Email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Usuarios_Uid",
                table: "Usuarios",
                column: "Uid",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Viagens_LinhaCodigo_Sentido_EncerradaEm",
                table: "Viagens",
                columns: new[] { "LinhaCodigo", "Sentido", "EncerradaEm" });

            migrationBuilder.CreateIndex(
                name: "IX_Viagens_UsuarioId_EncerradaEm",
                table: "Viagens",
                columns: new[] { "UsuarioId", "EncerradaEm" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ComentarioFotos");

            migrationBuilder.DropTable(
                name: "Denuncias");

            migrationBuilder.DropTable(
                name: "EventosLinhaDoTempo");

            migrationBuilder.DropTable(
                name: "GtfsPontosTrajeto");

            migrationBuilder.DropTable(
                name: "GtfsSentidos");

            migrationBuilder.DropTable(
                name: "OcorrenciaFotos");

            migrationBuilder.DropTable(
                name: "OcorrenciaFotosConclusao");

            migrationBuilder.DropTable(
                name: "OutboxEventos");

            migrationBuilder.DropTable(
                name: "Participacoes");

            migrationBuilder.DropTable(
                name: "PosicoesViagem");

            migrationBuilder.DropTable(
                name: "RegistrosIdempotencia");

            migrationBuilder.DropTable(
                name: "ZonasAtencao");

            migrationBuilder.DropTable(
                name: "Comentarios");

            migrationBuilder.DropTable(
                name: "GtfsLinhas");

            migrationBuilder.DropTable(
                name: "Viagens");

            migrationBuilder.DropTable(
                name: "Ocorrencias");

            migrationBuilder.DropTable(
                name: "Usuarios");
        }
    }
}
