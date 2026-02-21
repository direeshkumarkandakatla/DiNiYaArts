namespace DiNiYaArts.Api.Models;

public class PackageDefinition
{
    public int Id { get; set; }
    public int ClassTypeId { get; set; }
    public string Name { get; set; } = string.Empty; // e.g., "4-Session Pack"
    public int SessionCount { get; set; } // 4 or 8
    public decimal Price { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ClassType ClassType { get; set; } = null!;
}
