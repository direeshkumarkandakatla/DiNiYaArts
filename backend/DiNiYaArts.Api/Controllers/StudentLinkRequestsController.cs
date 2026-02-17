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
public class StudentLinkRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StudentLinkRequestsController> _logger;

    public StudentLinkRequestsController(ApplicationDbContext context, ILogger<StudentLinkRequestsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // Student/Parent: Search students to claim (returns limited info for privacy)
    [HttpGet("search-students")]
    public async Task<ActionResult> SearchStudents([FromQuery] string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length < 2)
            return BadRequest(new { message = "Please enter at least 2 characters to search" });

        var nameLower = name.ToLower();
        var students = await _context.Students
            .Where(s => s.IsActive &&
                (s.FirstName.ToLower().Contains(nameLower) ||
                 s.LastName.ToLower().Contains(nameLower)))
            .Select(s => new
            {
                s.Id,
                s.FirstName,
                s.LastName,
                AgeGroup = s.AgeGroup.HasValue ? s.AgeGroup.Value.ToString() : null
            })
            .Take(10)
            .ToListAsync();

        return Ok(students);
    }

    // Student/Parent: Claim an existing student
    [HttpPost("claim")]
    public async Task<ActionResult<StudentLinkRequestResponseDto>> ClaimStudent([FromBody] ClaimStudentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        if (!Enum.TryParse<StudentLinkType>(dto.LinkType, true, out var linkType))
            return BadRequest(new { message = "LinkType must be 'Self' or 'Parent'" });

        var student = await _context.Students.FindAsync(dto.StudentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        // Check for duplicate pending request
        var existingRequest = await _context.StudentLinkRequests
            .AnyAsync(r => r.RequestedByUserId == userId
                && r.StudentId == dto.StudentId
                && r.Status == LinkRequestStatus.Pending);

        if (existingRequest)
            return BadRequest(new { message = "You already have a pending request for this student" });

        // Check if student is already linked
        if (linkType == StudentLinkType.Self && student.UserId != null)
            return BadRequest(new { message = "This student is already linked to an account" });

        if (linkType == StudentLinkType.Parent && student.ParentUserId != null)
            return BadRequest(new { message = "This student already has a parent linked" });

        var request = new StudentLinkRequest
        {
            RequestedByUserId = userId,
            StudentId = dto.StudentId,
            LinkType = linkType,
            Status = LinkRequestStatus.Pending,
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentLinkRequests.Add(request);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} claimed student {StudentId} as {LinkType}", userId, dto.StudentId, linkType);

        return Ok(await MapToResponseDto(request.Id));
    }

    // Student/Parent: Create a new student profile request
    [HttpPost("create-student")]
    public async Task<ActionResult<StudentLinkRequestResponseDto>> CreateStudentRequest([FromBody] CreateStudentRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        if (!Enum.TryParse<StudentLinkType>(dto.LinkType, true, out var linkType))
            return BadRequest(new { message = "LinkType must be 'Self' or 'Parent'" });

        AgeGroup? ageGroup = null;
        if (!string.IsNullOrEmpty(dto.AgeGroup) && Enum.TryParse<AgeGroup>(dto.AgeGroup, true, out var parsedAg))
            ageGroup = parsedAg;

        var request = new StudentLinkRequest
        {
            RequestedByUserId = userId,
            StudentId = null,
            LinkType = linkType,
            Status = LinkRequestStatus.Pending,
            NewFirstName = dto.FirstName,
            NewLastName = dto.LastName,
            NewEmail = dto.Email,
            NewPhone = dto.Phone,
            NewDateOfBirth = dto.DateOfBirth,
            NewAgeGroup = ageGroup,
            CreatedAt = DateTime.UtcNow
        };

        _context.StudentLinkRequests.Add(request);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} requested new student profile: {FirstName} {LastName}", userId, dto.FirstName, dto.LastName);

        return Ok(await MapToResponseDto(request.Id));
    }

    // Student/Parent: Get my requests
    [HttpGet("my")]
    public async Task<ActionResult<IEnumerable<StudentLinkRequestResponseDto>>> GetMyRequests()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var requests = await _context.StudentLinkRequests
            .Include(r => r.RequestedBy)
            .Include(r => r.Student)
            .Include(r => r.ReviewedBy)
            .Where(r => r.RequestedByUserId == userId)
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests.Select(MapToDto));
    }

    // Admin: Get all pending requests
    [HttpGet("pending")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<StudentLinkRequestResponseDto>>> GetPending()
    {
        var requests = await _context.StudentLinkRequests
            .Include(r => r.RequestedBy)
            .Include(r => r.Student)
            .Include(r => r.ReviewedBy)
            .Where(r => r.Status == LinkRequestStatus.Pending)
            .OrderBy(r => r.CreatedAt)
            .ToListAsync();

        return Ok(requests.Select(MapToDto));
    }

    // Admin: Get pending count (for dashboard badge)
    [HttpGet("pending-count")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult> GetPendingCount()
    {
        var count = await _context.StudentLinkRequests
            .CountAsync(r => r.Status == LinkRequestStatus.Pending);

        return Ok(new { count });
    }

    // Admin: Approve a request
    [HttpPut("{id}/approve")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentLinkRequestResponseDto>> Approve(int id, [FromBody] ReviewLinkRequestDto? dto)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var request = await _context.StudentLinkRequests
            .Include(r => r.Student)
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
            return NotFound(new { message = "Request not found" });

        if (request.Status != LinkRequestStatus.Pending)
            return BadRequest(new { message = "This request has already been reviewed" });

        // If it's a create request, create the student first
        if (request.StudentId == null)
        {
            var newStudent = new Student
            {
                FirstName = request.NewFirstName!,
                LastName = request.NewLastName!,
                Email = request.NewEmail,
                Phone = request.NewPhone,
                DateOfBirth = request.NewDateOfBirth,
                AgeGroup = request.NewAgeGroup,
                CreatedAt = DateTime.UtcNow
            };

            _context.Students.Add(newStudent);
            await _context.SaveChangesAsync();

            request.StudentId = newStudent.Id;
            request.Student = newStudent;
        }

        // Link the student to the user
        var student = request.Student ?? await _context.Students.FindAsync(request.StudentId);
        if (student == null)
            return BadRequest(new { message = "Student no longer exists" });

        if (request.LinkType == StudentLinkType.Self)
            student.UserId = request.RequestedByUserId;
        else
            student.ParentUserId = request.RequestedByUserId;

        request.Status = LinkRequestStatus.Approved;
        request.ReviewedByUserId = adminUserId;
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewNotes = dto?.Notes;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin {AdminId} approved link request {RequestId}", adminUserId, id);

        return Ok(await MapToResponseDto(id));
    }

    // Admin: Reject a request
    [HttpPut("{id}/reject")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentLinkRequestResponseDto>> Reject(int id, [FromBody] ReviewLinkRequestDto? dto)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var request = await _context.StudentLinkRequests
            .FirstOrDefaultAsync(r => r.Id == id);

        if (request == null)
            return NotFound(new { message = "Request not found" });

        if (request.Status != LinkRequestStatus.Pending)
            return BadRequest(new { message = "This request has already been reviewed" });

        request.Status = LinkRequestStatus.Rejected;
        request.ReviewedByUserId = adminUserId;
        request.ReviewedAt = DateTime.UtcNow;
        request.ReviewNotes = dto?.Notes;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Admin {AdminId} rejected link request {RequestId}", adminUserId, id);

        return Ok(await MapToResponseDto(id));
    }

    private async Task<StudentLinkRequestResponseDto> MapToResponseDto(int requestId)
    {
        var request = await _context.StudentLinkRequests
            .Include(r => r.RequestedBy)
            .Include(r => r.Student)
            .Include(r => r.ReviewedBy)
            .FirstAsync(r => r.Id == requestId);

        return MapToDto(request);
    }

    private static StudentLinkRequestResponseDto MapToDto(StudentLinkRequest r) => new()
    {
        Id = r.Id,
        RequestedByUserId = r.RequestedByUserId,
        RequestedByName = (r.RequestedBy.FirstName ?? "") + " " + (r.RequestedBy.LastName ?? ""),
        RequestedByEmail = r.RequestedBy.Email ?? "",
        StudentId = r.StudentId,
        StudentName = r.Student != null ? r.Student.FirstName + " " + r.Student.LastName : null,
        LinkType = r.LinkType.ToString(),
        Status = r.Status.ToString(),
        NewFirstName = r.NewFirstName,
        NewLastName = r.NewLastName,
        NewEmail = r.NewEmail,
        NewPhone = r.NewPhone,
        NewDateOfBirth = r.NewDateOfBirth,
        NewAgeGroup = r.NewAgeGroup?.ToString(),
        CreatedAt = r.CreatedAt,
        ReviewedByName = r.ReviewedBy != null
            ? (r.ReviewedBy.FirstName ?? "") + " " + (r.ReviewedBy.LastName ?? "")
            : null,
        ReviewedAt = r.ReviewedAt,
        ReviewNotes = r.ReviewNotes
    };
}
