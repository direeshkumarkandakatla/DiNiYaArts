using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class UpdateSessionDto
{
    public int? ClassTypeId { get; set; }
    public DateTime? StartDateTime { get; set; }
    public int? DurationMinutes { get; set; }
    public int? MaxStudents { get; set; }
    public string? Notes { get; set; }
}

public class UpdateSessionStatusDto
{
    [Required]
    public string Status { get; set; } = string.Empty;
}
