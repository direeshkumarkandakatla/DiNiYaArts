using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class CreateSessionDto
{
    [Required]
    public int ClassTypeId { get; set; }

    [Required]
    public DateTime StartDateTime { get; set; }

    [Required]
    [Range(15, 480)]
    public int DurationMinutes { get; set; }

    [Range(1, 100)]
    public int MaxStudents { get; set; } = 10;

    public string? Notes { get; set; }

    public List<int>? StudentIds { get; set; }
}
