namespace DiNiYaArts.Api.Models;

public class Student
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }

    // Links to user account (optional - for students with login)
    public string? UserId { get; set; }

    // For kids managed by parents
    public string? ParentUserId { get; set; }

    public AgeGroup? AgeGroup { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ApplicationUser? User { get; set; }  // Student's own account (if they have one)
    public ApplicationUser? Parent { get; set; }  // Parent who manages this student
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
    public ICollection<StudentPackage> Packages { get; set; } = new List<StudentPackage>();
    public ICollection<Payment> Payments { get; set; } = new List<Payment>();
}
