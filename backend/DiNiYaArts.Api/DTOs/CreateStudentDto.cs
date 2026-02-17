using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class CreateStudentDto
{
    [Required]
    [StringLength(100)]
    public string FirstName { get; set; } = string.Empty;

    [Required]
    [StringLength(100)]
    public string LastName { get; set; } = string.Empty;

    [EmailAddress]
    public string? Email { get; set; }

    [Phone]
    public string? Phone { get; set; }

    public DateTime? DateOfBirth { get; set; }

    public string? AgeGroup { get; set; }
}
