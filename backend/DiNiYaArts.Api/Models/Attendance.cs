namespace DiNiYaArts.Api.Models;

public class Attendance
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public int StudentId { get; set; }
    public AttendanceStatus Status { get; set; } = AttendanceStatus.Assigned;
    public string? Notes { get; set; }
    public DateTime MarkedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public Session Session { get; set; } = null!;
    public Student Student { get; set; } = null!;
}

public enum AttendanceStatus
{
    Assigned,
    Present,
    Absent,
    Late,
    Excused
}
