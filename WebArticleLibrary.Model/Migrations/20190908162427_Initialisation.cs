using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace WebArticleLibrary.Model.Migrations
{
    public partial class Initialisation : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "User",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    Login = table.Column<string>(maxLength: 10, nullable: false),
                    FirstName = table.Column<string>(maxLength: 50, nullable: false),
                    LastName = table.Column<string>(maxLength: 50, nullable: false),
                    PatronymicName = table.Column<string>(maxLength: 50, nullable: true),
                    Email = table.Column<string>(maxLength: 50, nullable: false),
                    Hash = table.Column<string>(maxLength: 250, nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    ExpirationDate = table.Column<DateTime>(nullable: true),
                    ConfirmationDate = table.Column<Guid>(nullable: true),
                    NewEmail = table.Column<string>(nullable: true),
                    NewEmailExpirationDate = table.Column<DateTime>(nullable: true),
                    ResetPasswordExpirationDate = table.Column<DateTime>(nullable: true),
                    Photo = table.Column<byte[]>(nullable: true),
                    Status = table.Column<int>(nullable: false),
                    ShowPrivateInfo = table.Column<bool>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_User", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Article",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    AuthorId = table.Column<int>(nullable: false),
                    AssignedToId = table.Column<int>(nullable: true),
                    Name = table.Column<string>(maxLength: 200, nullable: false),
                    Description = table.Column<string>(maxLength: 500, nullable: true),
                    Tags = table.Column<string>(maxLength: 50, nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    Status = table.Column<int>(nullable: false),
                    Content = table.Column<byte[]>(nullable: false),
                    ReviewedContent = table.Column<byte[]>(nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Article", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Article_User_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Article_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "Amendment",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    AuthorId = table.Column<int>(nullable: false),
                    ArticleId = table.Column<int>(nullable: false),
                    Content = table.Column<string>(nullable: false),
                    Resolved = table.Column<bool>(nullable: false),
                    Archived = table.Column<bool>(nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Amendment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Amendment_Article_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Article",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Amendment_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ArticleHistory",
                columns: table => new
                {
                    ID = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    ArticleId = table.Column<int>(nullable: false),
                    AuthorId = table.Column<int>(nullable: false),
                    Object = table.Column<string>(nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    OldValue = table.Column<string>(nullable: true),
                    NewValue = table.Column<string>(nullable: true),
                    ObjectId = table.Column<int>(nullable: true),
                    ObjectType = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ArticleHistory", x => x.ID);
                    table.ForeignKey(
                        name: "FK_ArticleHistory_Article_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Article",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ArticleHistory_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserComment",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    AuthorId = table.Column<int>(nullable: false),
                    ResponseToId = table.Column<int>(nullable: true),
                    ArticleId = table.Column<int>(nullable: false),
                    Content = table.Column<byte[]>(nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    Status = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserComment", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserComment_Article_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Article",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserComment_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserComment_UserComment_ResponseToId",
                        column: x => x.ResponseToId,
                        principalTable: "UserComment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "UserEstimate",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    AuthorId = table.Column<int>(nullable: false),
                    ArticleId = table.Column<int>(nullable: false),
                    Estimate = table.Column<int>(nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserEstimate", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserEstimate_Article_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Article",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserEstimate_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserNotification",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    Text = table.Column<string>(maxLength: 250, nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    RecipientId = table.Column<int>(nullable: false),
                    ArticleHistoryId = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserNotification", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserNotification_ArticleHistory_ArticleHistoryId",
                        column: x => x.ArticleHistoryId,
                        principalTable: "ArticleHistory",
                        principalColumn: "ID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserNotification_User_RecipientId",
                        column: x => x.RecipientId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "UserComplaint",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.SerialColumn),
                    AuthorId = table.Column<int>(nullable: false),
                    AssignedToId = table.Column<int>(nullable: true),
                    UserCommentId = table.Column<int>(nullable: true),
                    ArticleId = table.Column<int>(nullable: false),
                    Text = table.Column<string>(nullable: false),
                    InsertDate = table.Column<DateTime>(nullable: false),
                    Status = table.Column<int>(nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_UserComplaint", x => x.Id);
                    table.ForeignKey(
                        name: "FK_UserComplaint_Article_ArticleId",
                        column: x => x.ArticleId,
                        principalTable: "Article",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserComplaint_User_AssignedToId",
                        column: x => x.AssignedToId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_UserComplaint_User_AuthorId",
                        column: x => x.AuthorId,
                        principalTable: "User",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_UserComplaint_UserComment_UserCommentId",
                        column: x => x.UserCommentId,
                        principalTable: "UserComment",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Amendment_ArticleId",
                table: "Amendment",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_Amendment_AuthorId",
                table: "Amendment",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_Article_AssignedToId",
                table: "Article",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_Article_AuthorId",
                table: "Article",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleHistory_ArticleId",
                table: "ArticleHistory",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_ArticleHistory_AuthorId",
                table: "ArticleHistory",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComment_ArticleId",
                table: "UserComment",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComment_AuthorId",
                table: "UserComment",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComment_ResponseToId",
                table: "UserComment",
                column: "ResponseToId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComplaint_ArticleId",
                table: "UserComplaint",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComplaint_AssignedToId",
                table: "UserComplaint",
                column: "AssignedToId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComplaint_AuthorId",
                table: "UserComplaint",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_UserComplaint_UserCommentId",
                table: "UserComplaint",
                column: "UserCommentId");

            migrationBuilder.CreateIndex(
                name: "IX_UserEstimate_ArticleId",
                table: "UserEstimate",
                column: "ArticleId");

            migrationBuilder.CreateIndex(
                name: "IX_UserEstimate_AuthorId",
                table: "UserEstimate",
                column: "AuthorId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_ArticleHistoryId",
                table: "UserNotification",
                column: "ArticleHistoryId");

            migrationBuilder.CreateIndex(
                name: "IX_UserNotification_RecipientId",
                table: "UserNotification",
                column: "RecipientId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Amendment");

            migrationBuilder.DropTable(
                name: "UserComplaint");

            migrationBuilder.DropTable(
                name: "UserEstimate");

            migrationBuilder.DropTable(
                name: "UserNotification");

            migrationBuilder.DropTable(
                name: "UserComment");

            migrationBuilder.DropTable(
                name: "ArticleHistory");

            migrationBuilder.DropTable(
                name: "Article");

            migrationBuilder.DropTable(
                name: "User");
        }
    }
}
