using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DiNiYaArts.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentAgeGroup : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AgeGroup",
                table: "Students",
                type: "INTEGER",
                nullable: true);

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AgeGroup",
                table: "Students");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "1",
                column: "ConcurrencyStamp",
                value: "90a9a120-23ce-49a1-97f4-533485ab74ed");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "2",
                column: "ConcurrencyStamp",
                value: "8cf821b6-2986-4a4a-975c-b5234d957c14");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "3",
                column: "ConcurrencyStamp",
                value: "0ec95cf7-a6a0-4729-8f1f-be16d3d29dce");

            migrationBuilder.UpdateData(
                table: "AspNetRoles",
                keyColumn: "Id",
                keyValue: "4",
                column: "ConcurrencyStamp",
                value: "f989b4ea-1d6c-4b9a-a493-99f03679b3ab");

            migrationBuilder.UpdateData(
                table: "ClassTypes",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2026, 2, 16, 22, 4, 8, 900, DateTimeKind.Utc).AddTicks(8171));
        }
    }
}
