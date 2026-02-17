namespace DiNiYaArts.Api.Models;

public class ClassType
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = "#3B82F6"; // For calendar display
    public string? Description { get; set; }
    public AgeGroup TargetAgeGroup { get; set; } = AgeGroup.AllAges;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
}

public enum AgeGroup
{
    Toddlers,      // 1-3 years
    Preschool,     // 4-5 years
    Kids,          // 6-9 years
    Preteens,      // 10-12 years
    Teens,         // 13-17 years
    Adults,        // 18+ years
    Seniors,       // 65+ years
    AllAges        // Any age
}
