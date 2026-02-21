using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiNiYaArts.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClassTypeDefaultPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DefaultSessionPrice",
                table: "ClassTypes",
                type: "decimal(10,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1",
                column: "ConcurrencyStamp",
                value: "8fc1cbc4-f893-4bee-b664-6f5aef625e0c");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2",
                column: "ConcurrencyStamp",
                value: "607ab32a-53ee-4b18-a127-1ecf62b67d5f");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3",
                column: "ConcurrencyStamp",
                value: "fc7dd7c8-b410-478a-b68a-6a51b3b49690");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4",
                column: "ConcurrencyStamp",
                value: "2c0a9d0e-070f-4fdd-89fb-6b998f6a4aeb");

            migrationBuilder.UpdateData(
                table: "ClassTypes",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "DefaultSessionPrice" },
                values: new object[] { new DateTime(2026, 2, 20, 19, 23, 11, 865, DateTimeKind.Utc).AddTicks(1252), 0m });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DefaultSessionPrice",
                table: "ClassTypes");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1",
                column: "ConcurrencyStamp",
                value: "d0ea77ee-b07c-46da-a89d-047af1915d21");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2",
                column: "ConcurrencyStamp",
                value: "b312238c-3eb3-4e5f-8e33-e4db1b6e04a9");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3",
                column: "ConcurrencyStamp",
                value: "7126a111-567a-4ca4-8535-759afd958616");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4",
                column: "ConcurrencyStamp",
                value: "05b3861e-6d03-4622-9f84-b00218cf6847");

            migrationBuilder.UpdateData(
                table: "ClassTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 20, 7, 37, 54, 733, DateTimeKind.Utc).AddTicks(9333));
        }
    }
}
