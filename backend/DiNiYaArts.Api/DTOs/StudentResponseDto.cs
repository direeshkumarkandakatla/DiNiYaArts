namespace DiNiYaArts.Api.DTOs;

public class StudentResponseDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? AgeGroup { get; set; }
    public bool IsActive { get; set; }
    public int TotalAttendances { get; set; }
    public DateTime CreatedAt { get; set; }
}
