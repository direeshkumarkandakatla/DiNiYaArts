namespace DiNiYaArts.Api.Models;

public class StudentPackage
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public int PackageDefinitionId { get; set; }
    public int BillingYear { get; set; }
    public int BillingMonth { get; set; } // 1-12

    // Snapshots at enrollment time
    public decimal PackagePrice { get; set; }
    public int SessionCount { get; set; }

    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedByUserId { get; set; } = string.Empty;

    // Navigation properties
    public Student Student { get; set; } = null!;
    public PackageDefinition PackageDefinition { get; set; } = null!;
    public ApplicationUser CreatedBy { get; set; } = null!;
}
