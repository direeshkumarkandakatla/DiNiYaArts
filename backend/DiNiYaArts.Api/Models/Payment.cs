namespace DiNiYaArts.Api.Models;

public class Payment
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public decimal Amount { get; set; }
    public decimal Discount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string RecordedByUserId { get; set; } = string.Empty;

    // Navigation properties
    public Student Student { get; set; } = null!;
    public ApplicationUser RecordedBy { get; set; } = null!;
}
