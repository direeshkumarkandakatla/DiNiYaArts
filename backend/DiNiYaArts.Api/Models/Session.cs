namespace DiNiYaArts.Api.Models;

public enum SessionStatus
{
    Scheduled,
    Completed,
    Cancelled
}

public class Session
{
    public int Id { get; set; }
    public int ClassTypeId { get; set; }
    public DateTime StartDateTime { get; set; }
    public int DurationMinutes { get; set; }  // Duration set by instructor
    public int MaxStudents { get; set; } = 10;
    public string? Notes { get; set; }
    public SessionStatus Status { get; set; } = SessionStatus.Scheduled;
    public string CreatedByUserId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Computed property for convenience
    public DateTime EndDateTime => StartDateTime.AddMinutes(DurationMinutes);

    // Navigation properties
    public ClassType ClassType { get; set; } = null!;
    public ApplicationUser CreatedBy { get; set; } = null!;
    public ICollection<Attendance> Attendances { get; set; } = new List<Attendance>();
}
