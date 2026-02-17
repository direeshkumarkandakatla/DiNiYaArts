namespace DiNiYaArts.Api.Models;

public class StudentLinkRequest
{
    public int Id { get; set; }
    public string RequestedByUserId { get; set; } = string.Empty;
    public int? StudentId { get; set; }  // Set when claiming existing, null when creating new
    public StudentLinkType LinkType { get; set; }
    public LinkRequestStatus Status { get; set; } = LinkRequestStatus.Pending;

    // For new student creation requests (StudentId is null)
    public string? NewFirstName { get; set; }
    public string? NewLastName { get; set; }
    public string? NewEmail { get; set; }
    public string? NewPhone { get; set; }
    public DateTime? NewDateOfBirth { get; set; }
    public AgeGroup? NewAgeGroup { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string? ReviewedByUserId { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public string? ReviewNotes { get; set; }

    // Navigation properties
    public ApplicationUser RequestedBy { get; set; } = null!;
    public Student? Student { get; set; }
    public ApplicationUser? ReviewedBy { get; set; }
}

public enum StudentLinkType
{
    Self,    // "I am this student"
    Parent   // "I am this student's parent"
}

public enum LinkRequestStatus
{
    Pending,
    Approved,
    Rejected
}
