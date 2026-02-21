using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

public class CreateBulkSessionDto
{
    [Required]
    public int ClassTypeId { get; set; }

    [Required]
    public TimeSpan StartTime { get; set; }  // e.g., 14:00

    [Required]
    [Range(15, 480)]
    public int DurationMinutes { get; set; }

    [Required]
    public DateTime FromDate { get; set; }  // Start of range

    [Required]
    public DateTime ToDate { get; set; }  // End of range

    [Required]
    [MinLength(1)]
    public List<DayOfWeek> DaysOfWeek { get; set; } = new();  // Mon, Wed, Fri etc.

    public RecurrencePattern Recurrence { get; set; } = RecurrencePattern.EveryWeek;

    [Range(1, 100)]
    public int MaxStudents { get; set; } = 10;

    public string? Notes { get; set; }

    public List<int>? StudentIds { get; set; }

    /// <summary>
    /// Client timezone offset in minutes from JS Date.getTimezoneOffset().
    /// Used to convert local start time to UTC for consistent storage.
    /// </summary>
    public int TimezoneOffsetMinutes { get; set; }
}

public enum RecurrencePattern
{
    EveryWeek,
    EveryOtherWeek,
    EveryThreeWeeks,
    EveryFourWeeks
}
