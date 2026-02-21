using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class ClassTypeResponseDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string TargetAgeGroup { get; set; } = string.Empty;
    public decimal DefaultSessionPrice { get; set; }
    public bool IsActive { get; set; }
}

public class CreateClassTypeDto
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [StringLength(7)]
    public string Color { get; set; } = "#3B82F6";

    [StringLength(500)]
    public string? Description { get; set; }

    public string TargetAgeGroup { get; set; } = "AllAges";

    [Range(0, 99999.99)]
    public decimal DefaultSessionPrice { get; set; }
}

public class UpdateClassTypeDto
{
    [StringLength(100)]
    public string? Name { get; set; }

    [StringLength(7)]
    public string? Color { get; set; }

    [StringLength(500)]
    public string? Description { get; set; }

    public string? TargetAgeGroup { get; set; }

    [Range(0, 99999.99)]
    public decimal? DefaultSessionPrice { get; set; }

    public bool? IsActive { get; set; }
}
