namespace DiNiYaArts.Api.DTOs;

public class ClassTypeResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TargetAgeGroup { get; set; } = string.Empty;
    public bool IsActive { get; set; }
}
