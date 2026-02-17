using Microsoft.AspNetCore.Identity;

namespace DiNiYaArts.Api.Models;

public class ApplicationUser : IdentityUser
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? ProfileImageUrl { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }
    public bool IsActive { get; set; } = true;

    // Navigation properties

    // For Instructor role: Sessions they created/teach
    public ICollection<Session> CreatedSessions { get; set; } = new List<Session>();

    // For Student role: Link to their student profile
    public Student? StudentProfile { get; set; }

    // For Parent role: Students they manage (their kids)
    public ICollection<Student> ManagedStudents { get; set; } = new List<Student>();
}
