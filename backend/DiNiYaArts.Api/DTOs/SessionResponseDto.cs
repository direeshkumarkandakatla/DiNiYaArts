namespace DiNiYaArts.Api.DTOs;

public class SessionResponseDto
{
    public int Id { get; set; }
    public int ClassTypeId { get; set; }
    public string ClassTypeName { get; set; } = string.Empty;
    public string ClassTypeColor { get; set; } = string.Empty;
    public DateTime StartDateTime { get; set; }
    public DateTime EndDateTime { get; set; }
    public int DurationMinutes { get; set; }
    public int MaxStudents { get; set; }
    public int CurrentStudentCount { get; set; }
    public string? Notes { get; set; }
    public string Status { get; set; } = "Scheduled";
    public string CreatedByUserId { get; set; } = string.Empty;
    public string CreatedByName { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
