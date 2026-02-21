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
public class SessionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SessionsController> _logger;

    public SessionsController(ApplicationDbContext context, ILogger<SessionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<SessionResponseDto>>> GetAll(
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int? classTypeId)
    {
        _logger.LogInformation("Fetching sessions - From: {From}, To: {To}, ClassTypeId: {ClassTypeId}",
            from, to, classTypeId);

        var query = _context.Sessions
            .Include(s => s.ClassType)
            .Include(s => s.CreatedBy)
            .Include(s => s.Attendances)
                .ThenInclude(a => a.Student)
            .AsQueryable();

        // Filter by date range (useful for calendar view)
        if (from.HasValue)
            query = query.Where(s => s.StartDateTime >= from.Value);

        if (to.HasValue)
            query = query.Where(s => s.StartDateTime <= to.Value);

        // Filter by class type
        if (classTypeId.HasValue)
            query = query.Where(s => s.ClassTypeId == classTypeId.Value);

        var sessions = await query
            .OrderBy(s => s.StartDateTime)
            .Select(s => new SessionResponseDto
            {
                Id = s.Id,
                ClassTypeId = s.ClassTypeId,
                ClassTypeName = s.ClassType.Name,
                ClassTypeColor = s.ClassType.Color,
                StartDateTime = s.StartDateTime,
                EndDateTime = s.StartDateTime.AddMinutes(s.DurationMinutes),
                DurationMinutes = s.DurationMinutes,
                MaxStudents = s.MaxStudents,
                CurrentStudentCount = s.Status == SessionStatus.Scheduled
                    ? s.Attendances.Count(a => a.Student.IsActive)
                    : s.Attendances.Count,
                Notes = s.Notes,
                Status = s.Status.ToString(),
                CreatedByUserId = s.CreatedByUserId,
                CreatedByName = (s.CreatedBy.FirstName ?? "") + " " + (s.CreatedBy.LastName ?? ""),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} sessions", sessions.Count);
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<SessionResponseDto>> GetById(int id)
    {
        _logger.LogInformation("Fetching session with ID {SessionId}", id);

        var session = await _context.Sessions
            .Include(s => s.ClassType)
            .Include(s => s.CreatedBy)
            .Include(s => s.Attendances)
                .ThenInclude(a => a.Student)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null)
        {
            _logger.LogWarning("Session with ID {SessionId} not found", id);
            return NotFound(new { message = "Session not found" });
        }

        return Ok(new SessionResponseDto
        {
            Id = session.Id,
            ClassTypeId = session.ClassTypeId,
            ClassTypeName = session.ClassType.Name,
            ClassTypeColor = session.ClassType.Color,
            StartDateTime = session.StartDateTime,
            EndDateTime = session.StartDateTime.AddMinutes(session.DurationMinutes),
            DurationMinutes = session.DurationMinutes,
            MaxStudents = session.MaxStudents,
            CurrentStudentCount = session.Status == SessionStatus.Scheduled
                ? session.Attendances.Count(a => a.Student.IsActive)
                : session.Attendances.Count,
            Notes = session.Notes,
            Status = session.Status.ToString(),
            CreatedByUserId = session.CreatedByUserId,
            CreatedByName = (session.CreatedBy.FirstName ?? "") + " " + (session.CreatedBy.LastName ?? ""),
            CreatedAt = session.CreatedAt
        });
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<SessionResponseDto>> Create([FromBody] CreateSessionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("User {UserId} creating session for ClassTypeId {ClassTypeId} at {StartDateTime}",
            userId, dto.ClassTypeId, dto.StartDateTime);

        // Validate class type exists
        var classType = await _context.ClassTypes.FindAsync(dto.ClassTypeId);
        if (classType == null)
        {
            _logger.LogWarning("Invalid ClassTypeId {ClassTypeId} provided", dto.ClassTypeId);
            return BadRequest(new { message = "Invalid class type" });
        }

        var session = new Session
        {
            ClassTypeId = dto.ClassTypeId,
            StartDateTime = dto.StartDateTime,
            DurationMinutes = dto.DurationMinutes,
            MaxStudents = dto.MaxStudents,
            Notes = dto.Notes,
            CreatedByUserId = userId!,
            CreatedAt = DateTime.UtcNow
        };

        _context.Sessions.Add(session);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} created successfully by user {UserId}", session.Id, userId);

        // Assign students if provided
        var assignedCount = 0;
        if (dto.StudentIds is { Count: > 0 })
        {
            var validStudentIds = await _context.Students
                .Where(s => dto.StudentIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            var attendances = validStudentIds.Select(studentId => new Attendance
            {
                SessionId = session.Id,
                StudentId = studentId,
                Status = AttendanceStatus.Assigned,
                MarkedAt = DateTime.UtcNow
            }).ToList();

            _context.Attendances.AddRange(attendances);
            await _context.SaveChangesAsync();
            assignedCount = attendances.Count;
        }

        // Reload with navigation properties for response
        var createdSession = await _context.Sessions
            .Include(s => s.ClassType)
            .Include(s => s.CreatedBy)
            .FirstAsync(s => s.Id == session.Id);

        var response = new SessionResponseDto
        {
            Id = createdSession.Id,
            ClassTypeId = createdSession.ClassTypeId,
            ClassTypeName = createdSession.ClassType.Name,
            ClassTypeColor = createdSession.ClassType.Color,
            StartDateTime = createdSession.StartDateTime,
            EndDateTime = createdSession.StartDateTime.AddMinutes(createdSession.DurationMinutes),
            DurationMinutes = createdSession.DurationMinutes,
            MaxStudents = createdSession.MaxStudents,
            CurrentStudentCount = assignedCount,
            Notes = createdSession.Notes,
            Status = createdSession.Status.ToString(),
            CreatedByUserId = createdSession.CreatedByUserId,
            CreatedByName = (createdSession.CreatedBy.FirstName ?? "") + " " + (createdSession.CreatedBy.LastName ?? ""),
            CreatedAt = createdSession.CreatedAt
        };

        return CreatedAtAction(nameof(GetById), new { id = session.Id }, response);
    }

    [HttpPost("bulk")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<SessionResponseDto>>> CreateBulk([FromBody] CreateBulkSessionDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation(
            "User {UserId} creating bulk sessions for ClassTypeId {ClassTypeId} from {From} to {To}, Days: {Days}, Recurrence: {Recurrence}",
            userId, dto.ClassTypeId, dto.FromDate, dto.ToDate, string.Join(",", dto.DaysOfWeek), dto.Recurrence);

        // Validate class type exists
        var classType = await _context.ClassTypes.FindAsync(dto.ClassTypeId);
        if (classType == null)
            return BadRequest(new { message = "Invalid class type" });

        if (dto.FromDate > dto.ToDate)
            return BadRequest(new { message = "From date must be before To date" });

        // Calculate the week interval based on recurrence pattern
        int weekInterval = dto.Recurrence switch
        {
            RecurrencePattern.EveryWeek => 1,
            RecurrencePattern.EveryOtherWeek => 2,
            RecurrencePattern.EveryThreeWeeks => 3,
            RecurrencePattern.EveryFourWeeks => 4,
            _ => 1
        };

        // Generate all session dates
        var sessions = new List<Session>();
        var currentDate = dto.FromDate.Date;

        // Find the first matching day on or after FromDate
        while (currentDate <= dto.ToDate.Date)
        {
            if (dto.DaysOfWeek.Contains(currentDate.DayOfWeek))
            {
                // Combine date + time, then convert local to UTC using client's timezone offset
                // JS getTimezoneOffset() returns (UTC - Local) in minutes, so UTC = Local + offset
                var localDateTime = currentDate.Add(dto.StartTime);
                var startDateTime = DateTime.SpecifyKind(
                    localDateTime.AddMinutes(dto.TimezoneOffsetMinutes),
                    DateTimeKind.Utc);
                sessions.Add(new Session
                {
                    ClassTypeId = dto.ClassTypeId,
                    StartDateTime = startDateTime,
                    DurationMinutes = dto.DurationMinutes,
                    MaxStudents = dto.MaxStudents,
                    Notes = dto.Notes,
                    CreatedByUserId = userId!,
                    CreatedAt = DateTime.UtcNow
                });
            }

            currentDate = currentDate.AddDays(1);

            // If we've gone through a full week, skip ahead based on recurrence
            if (currentDate.DayOfWeek == dto.FromDate.DayOfWeek && weekInterval > 1)
            {
                currentDate = currentDate.AddDays(7 * (weekInterval - 1));
            }
        }

        if (sessions.Count == 0)
            return BadRequest(new { message = "No sessions generated for the given criteria" });

        _context.Sessions.AddRange(sessions);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Bulk created {Count} sessions by user {UserId}", sessions.Count, userId);

        // Assign students if provided
        var assignedCount = 0;
        if (dto.StudentIds is { Count: > 0 })
        {
            var validStudentIds = await _context.Students
                .Where(s => dto.StudentIds.Contains(s.Id))
                .Select(s => s.Id)
                .ToListAsync();

            var attendances = sessions.SelectMany(session =>
                validStudentIds.Select(studentId => new Attendance
                {
                    SessionId = session.Id,
                    StudentId = studentId,
                    Status = AttendanceStatus.Assigned,
                    MarkedAt = DateTime.UtcNow
                })
            ).ToList();

            _context.Attendances.AddRange(attendances);
            await _context.SaveChangesAsync();
            assignedCount = validStudentIds.Count;
        }

        // Reload with navigation properties for response
        var sessionIds = sessions.Select(s => s.Id).ToList();
        var createdSessions = await _context.Sessions
            .Include(s => s.ClassType)
            .Include(s => s.CreatedBy)
            .Where(s => sessionIds.Contains(s.Id))
            .OrderBy(s => s.StartDateTime)
            .Select(s => new SessionResponseDto
            {
                Id = s.Id,
                ClassTypeId = s.ClassTypeId,
                ClassTypeName = s.ClassType.Name,
                ClassTypeColor = s.ClassType.Color,
                StartDateTime = s.StartDateTime,
                EndDateTime = s.StartDateTime.AddMinutes(s.DurationMinutes),
                DurationMinutes = s.DurationMinutes,
                MaxStudents = s.MaxStudents,
                CurrentStudentCount = assignedCount,
                Notes = s.Notes,
                Status = s.Status.ToString(),
                CreatedByUserId = s.CreatedByUserId,
                CreatedByName = (s.CreatedBy.FirstName ?? "") + " " + (s.CreatedBy.LastName ?? ""),
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        return Ok(createdSessions);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<SessionResponseDto>> Update(int id, [FromBody] UpdateSessionDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("User {UserId} updating session {SessionId}", userId, id);

        var session = await _context.Sessions
            .Include(s => s.ClassType)
            .Include(s => s.CreatedBy)
            .Include(s => s.Attendances)
                .ThenInclude(a => a.Student)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (session == null)
        {
            _logger.LogWarning("Session {SessionId} not found for update", id);
            return NotFound(new { message = "Session not found" });
        }

        // Block updates when session is Completed or Cancelled
        if (session.Status != SessionStatus.Scheduled)
        {
            return BadRequest(new { message = $"Cannot edit a session with status '{session.Status}'. Reopen it first." });
        }

        // Instructors can only edit their own sessions
        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && session.CreatedByUserId != userId)
        {
            _logger.LogWarning("Instructor {UserId} tried to update session {SessionId} owned by {OwnerId}", userId, id, session.CreatedByUserId);
            return Forbid();
        }

        // Update only provided fields
        if (dto.ClassTypeId.HasValue)
        {
            var classType = await _context.ClassTypes.FindAsync(dto.ClassTypeId.Value);
            if (classType == null)
                return BadRequest(new { message = "Invalid class type" });
            session.ClassTypeId = dto.ClassTypeId.Value;
        }

        if (dto.StartDateTime.HasValue)
            session.StartDateTime = dto.StartDateTime.Value;

        if (dto.DurationMinutes.HasValue)
            session.DurationMinutes = dto.DurationMinutes.Value;

        if (dto.MaxStudents.HasValue)
            session.MaxStudents = dto.MaxStudents.Value;

        if (dto.Notes != null)
            session.Notes = dto.Notes;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} updated successfully", id);

        return Ok(new SessionResponseDto
        {
            Id = session.Id,
            ClassTypeId = session.ClassTypeId,
            ClassTypeName = session.ClassType.Name,
            ClassTypeColor = session.ClassType.Color,
            StartDateTime = session.StartDateTime,
            EndDateTime = session.StartDateTime.AddMinutes(session.DurationMinutes),
            DurationMinutes = session.DurationMinutes,
            MaxStudents = session.MaxStudents,
            CurrentStudentCount = session.Attendances.Count(a => a.Student.IsActive),
            Notes = session.Notes,
            Status = session.Status.ToString(),
            CreatedByUserId = session.CreatedByUserId,
            CreatedByName = (session.CreatedBy.FirstName ?? "") + " " + (session.CreatedBy.LastName ?? ""),
            CreatedAt = session.CreatedAt
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("User {UserId} deleting session {SessionId}", userId, id);

        var session = await _context.Sessions.FindAsync(id);
        if (session == null)
        {
            _logger.LogWarning("Session {SessionId} not found for deletion", id);
            return NotFound(new { message = "Session not found" });
        }

        // Block deletion of Completed sessions
        if (session.Status == SessionStatus.Completed)
        {
            return BadRequest(new { message = "Cannot delete a completed session." });
        }

        // Instructors can only delete their own sessions
        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && session.CreatedByUserId != userId)
        {
            _logger.LogWarning("Instructor {UserId} tried to delete session {SessionId} owned by {OwnerId}", userId, id, session.CreatedByUserId);
            return Forbid();
        }

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} deleted successfully", id);
        return NoContent();
    }

    [HttpPatch("{id}/status")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateSessionStatusDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("User {UserId} updating status of session {SessionId} to {Status}", userId, id, dto.Status);

        var session = await _context.Sessions.FindAsync(id);
        if (session == null)
            return NotFound(new { message = "Session not found" });

        if (!Enum.TryParse<SessionStatus>(dto.Status, true, out var newStatus))
            return BadRequest(new { message = $"Invalid status '{dto.Status}'. Valid values: Scheduled, Completed, Cancelled." });

        // Instructors can only change status of their own sessions
        var isAdmin = User.IsInRole("Administrator");
        if (!isAdmin && session.CreatedByUserId != userId)
            return Forbid();

        session.Status = newStatus;
        await _context.SaveChangesAsync();

        _logger.LogInformation("Session {SessionId} status changed to {Status}", id, newStatus);
        return Ok(new { message = $"Session status updated to {newStatus}", status = newStatus.ToString() });
    }

    [HttpPost("bulk-complete")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<IActionResult> BulkComplete()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("User {UserId} triggering bulk-complete for past scheduled sessions", userId);

        var now = DateTime.UtcNow;
        var pastScheduled = await _context.Sessions
            .Where(s => s.Status == SessionStatus.Scheduled && s.StartDateTime < now)
            .ToListAsync();

        foreach (var session in pastScheduled)
        {
            session.Status = SessionStatus.Completed;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Bulk-completed {Count} past sessions", pastScheduled.Count);
        return Ok(new { message = $"{pastScheduled.Count} session(s) marked as completed.", count = pastScheduled.Count });
    }
}
