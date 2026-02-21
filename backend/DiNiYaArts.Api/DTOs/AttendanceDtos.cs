namespace DiNiYaArts.Api.DTOs;

public class AttendanceResponseDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime MarkedAt { get; set; }
}

public class StudentAttendanceResponseDto
{
    public int Id { get; set; }
    public int SessionId { get; set; }
    public DateTime SessionDate { get; set; }
    public string ClassTypeName { get; set; } = string.Empty;
    public string ClassTypeColor { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Notes { get; set; }
    public DateTime MarkedAt { get; set; }
}

public class MarkAttendanceDto
{
    public int StudentId { get; set; }
    public string Status { get; set; } = "Assigned";
    public string? Notes { get; set; }
}

public class BulkMarkAttendanceDto
{
    public List<MarkAttendanceDto> Attendances { get; set; } = new();
}

public class SessionAttendanceSummaryDto
{
    public int SessionId { get; set; }
    public int AssignedCount { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public List<AttendanceResponseDto> Attendances { get; set; } = new();
}

public class StudentAttendanceSummaryDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int TotalSessions { get; set; }
    public int PresentCount { get; set; }
    public int AbsentCount { get; set; }
    public int LateCount { get; set; }
    public int ExcusedCount { get; set; }
    public double AttendanceRate { get; set; } // (Present + Late) / (Total - Assigned) * 100
    public List<StudentAttendanceResponseDto> RecentAttendances { get; set; } = new();
}
