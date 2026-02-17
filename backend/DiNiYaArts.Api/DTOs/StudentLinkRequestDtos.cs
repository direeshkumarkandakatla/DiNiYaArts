using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

// For claiming an existing student
public class ClaimStudentDto
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public string LinkType { get; set; } = "Self"; // "Self" or "Parent"
}

// For creating a new student profile request
public class CreateStudentRequestDto
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

    [Required]
    public string LinkType { get; set; } = "Self"; // "Self" or "Parent"
}

// Admin review action
public class ReviewLinkRequestDto
{
    public string? Notes { get; set; }
}

// Response DTO
public class StudentLinkRequestResponseDto
{
    public int Id { get; set; }
    public string RequestedByUserId { get; set; } = string.Empty;
    public string RequestedByName { get; set; } = string.Empty;
    public string RequestedByEmail { get; set; } = string.Empty;
    public int? StudentId { get; set; }
    public string? StudentName { get; set; }
    public string LinkType { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;

    // New student details (for create requests)
    public string? NewFirstName { get; set; }
    public string? NewLastName { get; set; }
    public string? NewEmail { get; set; }
    public string? NewPhone { get; set; }
    public DateTime? NewDateOfBirth { get; set; }
    public string? NewAgeGroup { get; set; }

    public DateTime CreatedAt { get; set; }
    public string? ReviewedByName { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }
}
