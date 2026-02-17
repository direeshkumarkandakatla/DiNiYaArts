using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiNiYaArts.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentLinkRequests : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "StudentLinkRequests",
                columns: table => new
                {
                    Id = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    RequestedByUserId = table.Column<string>(type: "TEXT", nullable: false),
                    StudentId = table.Column<int>(type: "INTEGER", nullable: true),
                    LinkType = table.Column<int>(type: "INTEGER", nullable: false),
                    Status = table.Column<int>(type: "INTEGER", nullable: false),
                    NewFirstName = table.Column<string>(type: "TEXT", nullable: true),
                    NewLastName = table.Column<string>(type: "TEXT", nullable: true),
                    NewEmail = table.Column<string>(type: "TEXT", nullable: true),
                    NewPhone = table.Column<string>(type: "TEXT", nullable: true),
                    NewDateOfBirth = table.Column<DateTime>(type: "TEXT", nullable: true),
                    NewAgeGroup = table.Column<int>(type: "INTEGER", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "TEXT", nullable: false),
                    ReviewedByUserId = table.Column<string>(type: "TEXT", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "TEXT", nullable: true),
                    ReviewNotes = table.Column<string>(type: "TEXT", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentLinkRequests", x => x.Id);
                    table.ForeignKey(
                        name: "FK_StudentLinkRequests_AspNetUsers_RequestedByUserId",
                        column: x => x.RequestedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StudentLinkRequests_AspNetUsers_ReviewedByUserId",
                        column: x => x.ReviewedByUserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_StudentLinkRequests_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1",
                column: "ConcurrencyStamp",
                value: "3a116310-c8cc-4610-b9ca-8187c3d01291");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2",
                column: "ConcurrencyStamp",
                value: "9bb4cc99-c4c8-46e9-8527-2a22a90614ff");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3",
                column: "ConcurrencyStamp",
                value: "524a5944-86ef-44e3-afeb-a1f87cebd823");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4",
                column: "ConcurrencyStamp",
                value: "73782357-2746-498e-ad67-0818855673ba");

            migrationBuilder.UpdateData(
                table: "ClassTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 17, 6, 59, 56, 854, DateTimeKind.Utc).AddTicks(3652));

            migrationBuilder.CreateIndex(
                name: "IX_StudentLinkRequests_RequestedByUserId",
                table: "StudentLinkRequests",
                column: "RequestedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLinkRequests_ReviewedByUserId",
                table: "StudentLinkRequests",
                column: "ReviewedByUserId");

            migrationBuilder.CreateIndex(
                name: "IX_StudentLinkRequests_StudentId",
                table: "StudentLinkRequests",
                column: "StudentId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentLinkRequests");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1",
                column: "ConcurrencyStamp",
                value: "7a438a94-6104-475e-a275-dbf8209588f6");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2",
                column: "ConcurrencyStamp",
                value: "e7745926-6e81-4537-ab7b-1d9cf9050ce7");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3",
                column: "ConcurrencyStamp",
                value: "b7f140f2-7634-443a-8773-4d65a30c3866");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4",
                column: "ConcurrencyStamp",
                value: "8b19e01b-f98a-45ce-8312-6ff5ac464d5e");

            migrationBuilder.UpdateData(
                table: "ClassTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 17, 6, 38, 5, 332, DateTimeKind.Utc).AddTicks(8602));
        }
    }
}
