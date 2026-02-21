using System.Security.Claims;
using DiNiYaArts.Api.Data;
using DiNiYaArts.Api.DTOs;
using DiNiYaArts.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiNiYaArts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class AttendanceController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<AttendanceController> _logger;

    public AttendanceController(ApplicationDbContext context, ILogger<AttendanceController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET /api/attendance/session/{sessionId} — Get attendance for a session
    [HttpGet("session/{sessionId}")]
    public async Task<ActionResult<SessionAttendanceSummaryDto>> GetForSession(int sessionId)
    {
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null)
            return NotFound(new { message = "Session not found" });

        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Where(a => a.SessionId == sessionId)
            .OrderBy(a => a.Student.FirstName)
            .ThenBy(a => a.Student.LastName)
            .ToListAsync();

        return Ok(BuildSessionSummary(sessionId, attendances));
    }

    // POST /api/attendance/session/{sessionId} — Bulk assign/mark attendance
    [HttpPost("session/{sessionId}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<SessionAttendanceSummaryDto>> BulkMark(int sessionId, [FromBody] BulkMarkAttendanceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null)
            return NotFound(new { message = "Session not found" });

        // Instructor can only manage attendance for their own sessions
        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && session.CreatedByUserId != userId)
            return Forbid();

        // Get existing attendance records for this session
        var existing = await _context.Attendances
            .Where(a => a.SessionId == sessionId)
            .ToListAsync();

        var existingByStudent = existing.ToDictionary(a => a.StudentId);

        foreach (var item in dto.Attendances)
        {
            if (!Enum.TryParse<AttendanceStatus>(item.Status, true, out var status))
                continue;

            // Validate student exists
            var studentExists = await _context.Students.AnyAsync(s => s.Id == item.StudentId);
            if (!studentExists)
                continue;

            if (existingByStudent.TryGetValue(item.StudentId, out var record))
            {
                // Update existing
                record.Status = status;
                record.Notes = item.Notes;
                record.MarkedAt = DateTime.UtcNow;
            }
            else
            {
                // Create new
                _context.Attendances.Add(new Attendance
                {
                    SessionId = sessionId,
                    StudentId = item.StudentId,
                    Status = status,
                    Notes = item.Notes,
                    MarkedAt = DateTime.UtcNow
                });
            }
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("User {UserId} bulk marked attendance for session {SessionId}: {Count} records",
            userId, sessionId, dto.Attendances.Count);

        // Reload and return summary
        var attendances = await _context.Attendances
            .Include(a => a.Student)
            .Where(a => a.SessionId == sessionId)
            .OrderBy(a => a.Student.FirstName)
            .ThenBy(a => a.Student.LastName)
            .ToListAsync();

        return Ok(BuildSessionSummary(sessionId, attendances));
    }

    // PUT /api/attendance/{id} — Update single attendance record
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<AttendanceResponseDto>> Update(int id, [FromBody] MarkAttendanceDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var attendance = await _context.Attendances
            .Include(a => a.Student)
            .Include(a => a.Session)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
            return NotFound(new { message = "Attendance record not found" });

        // Instructor ownership check
        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && attendance.Session.CreatedByUserId != userId)
            return Forbid();

        if (Enum.TryParse<AttendanceStatus>(dto.Status, true, out var status))
            attendance.Status = status;

        attendance.Notes = dto.Notes;
        attendance.MarkedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} updated attendance {AttendanceId} to {Status}", userId, id, dto.Status);

        return Ok(MapToDto(attendance));
    }

    // DELETE /api/attendance/{id} — Remove attendance record
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var attendance = await _context.Attendances
            .Include(a => a.Session)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
            return NotFound(new { message = "Attendance record not found" });

        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && attendance.Session.CreatedByUserId != userId)
            return Forbid();

        _context.Attendances.Remove(attendance);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} deleted attendance {AttendanceId}", userId, id);
        return NoContent();
    }

    // GET /api/attendance/student/{studentId} — Student's attendance history
    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<IEnumerable<StudentAttendanceResponseDto>>> GetForStudent(int studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        // Access control: Student/Parent can only see their own linked students
        if (!CanAccessStudent(student))
            return Forbid();

        var attendances = await _context.Attendances
            .Include(a => a.Session)
            .ThenInclude(s => s.ClassType)
            .Where(a => a.StudentId == studentId)
            .OrderByDescending(a => a.Session.StartDateTime)
            .Select(a => new StudentAttendanceResponseDto
            {
                Id = a.Id,
                SessionId = a.SessionId,
                SessionDate = a.Session.StartDateTime,
                ClassTypeName = a.Session.ClassType.Name,
                ClassTypeColor = a.Session.ClassType.Color,
                Status = a.Status.ToString(),
                Notes = a.Notes,
                MarkedAt = a.MarkedAt
            })
            .ToListAsync();

        return Ok(attendances);
    }

    // GET /api/attendance/student/{studentId}/summary — Student's attendance stats
    [HttpGet("student/{studentId}/summary")]
    public async Task<ActionResult<StudentAttendanceSummaryDto>> GetStudentSummary(int studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        if (!CanAccessStudent(student))
            return Forbid();

        return Ok(await BuildStudentSummary(student));
    }

    // GET /api/attendance/my — Attendance for current user's linked students
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<StudentAttendanceSummaryDto>>> GetMy()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var linkedStudents = await _context.Students
            .Where(s => s.UserId == userId || s.ParentUserId == userId)
            .ToListAsync();

        var summaries = new List<StudentAttendanceSummaryDto>();
        foreach (var student in linkedStudents)
        {
            summaries.Add(await BuildStudentSummary(student));
        }

        return Ok(summaries);
    }

    // --- Helpers ---

    private bool CanAccessStudent(Student student)
    {
        var isAdmin = User.IsInRole("Administrator");
        var isInstructor = User.IsInRole("Instructor");
        if (isAdmin || isInstructor)
            return true;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return student.UserId == userId || student.ParentUserId == userId;
    }

    private static SessionAttendanceSummaryDto BuildSessionSummary(int sessionId, List<Attendance> attendances)
    {
        return new SessionAttendanceSummaryDto
        {
            SessionId = sessionId,
            AssignedCount = attendances.Count(a => a.Status == AttendanceStatus.Assigned),
            PresentCount = attendances.Count(a => a.Status == AttendanceStatus.Present),
            AbsentCount = attendances.Count(a => a.Status == AttendanceStatus.Absent),
            LateCount = attendances.Count(a => a.Status == AttendanceStatus.Late),
            ExcusedCount = attendances.Count(a => a.Status == AttendanceStatus.Excused),
            Attendances = attendances.Select(MapToDto).ToList()
        };
    }

    private async Task<StudentAttendanceSummaryDto> BuildStudentSummary(Student student)
    {
        var attendances = await _context.Attendances
            .Include(a => a.Session)
            .ThenInclude(s => s.ClassType)
            .Where(a => a.StudentId == student.Id)
            .OrderByDescending(a => a.Session.StartDateTime)
            .ToListAsync();

        var markedRecords = attendances.Where(a => a.Status != AttendanceStatus.Assigned).ToList();
        var totalMarked = markedRecords.Count;
        var presentCount = markedRecords.Count(a => a.Status == AttendanceStatus.Present);
        var lateCount = markedRecords.Count(a => a.Status == AttendanceStatus.Late);

        return new StudentAttendanceSummaryDto
        {
            StudentId = student.Id,
            StudentName = $"{student.FirstName} {student.LastName}",
            TotalSessions = attendances.Count,
            PresentCount = presentCount,
            AbsentCount = markedRecords.Count(a => a.Status == AttendanceStatus.Absent),
            LateCount = lateCount,
            ExcusedCount = markedRecords.Count(a => a.Status == AttendanceStatus.Excused),
            AttendanceRate = totalMarked > 0 ? Math.Round((presentCount + lateCount) * 100.0 / totalMarked, 1) : 0,
            RecentAttendances = attendances.Select(a => new StudentAttendanceResponseDto
            {
                Id = a.Id,
                SessionId = a.SessionId,
                SessionDate = a.Session.StartDateTime,
                ClassTypeName = a.Session.ClassType.Name,
                ClassTypeColor = a.Session.ClassType.Color,
                Status = a.Status.ToString(),
                Notes = a.Notes,
                MarkedAt = a.MarkedAt
            }).ToList()
        };
    }

    private static AttendanceResponseDto MapToDto(Attendance a) => new()
    {
        Id = a.Id,
        StudentId = a.StudentId,
        StudentName = $"{a.Student.FirstName} {a.Student.LastName}",
        Status = a.Status.ToString(),
        Notes = a.Notes,
        MarkedAt = a.MarkedAt
    };
}
