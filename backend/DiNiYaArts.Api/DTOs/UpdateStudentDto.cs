using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class UpdateStudentDto
{
    [StringLength(100)]
    public string? FirstName { get; set; }

    [StringLength(100)]
    public string? LastName { get; set; }

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? AgeGroup { get; set; }

    public bool? IsActive { get; set; }
}
