using System.Globalization;
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
public class StudentsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<StudentsController> _logger;

    public StudentsController(ApplicationDbContext context, ILogger<StudentsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<StudentResponseDto>>> GetAll(
        [FromQuery] bool? activeOnly,
        [FromQuery] string? search)
    {
        _logger.LogInformation("Fetching students - ActiveOnly: {ActiveOnly}, Search: {Search}", activeOnly, search);

        var query = _context.Students
            .Include(s => s.Attendances)
            .Include(s => s.User)
            .Include(s => s.Parent)
            .Include(s => s.Packages)
                .ThenInclude(sp => sp.PackageDefinition)
                    .ThenInclude(pd => pd.ClassType)
            .AsQueryable();

        if (activeOnly == true)
            query = query.Where(s => s.IsActive);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(s =>
                s.FirstName.ToLower().Contains(searchLower) ||
                s.LastName.ToLower().Contains(searchLower) ||
                (s.Email != null && s.Email.ToLower().Contains(searchLower)));
        }

        var studentEntities = await query
            .OrderBy(s => s.FirstName)
            .ThenBy(s => s.LastName)
            .ToListAsync();

        var students = studentEntities.Select(MapToDto).ToList();

        _logger.LogInformation("Retrieved {Count} students", students.Count);
        return Ok(students);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StudentResponseDto>> GetById(int id)
    {
        _logger.LogInformation("Fetching student with ID {StudentId}", id);

        var student = await _context.Students
            .Include(s => s.Attendances)
            .Include(s => s.User)
            .Include(s => s.Parent)
            .Include(s => s.Packages)
                .ThenInclude(sp => sp.PackageDefinition)
                    .ThenInclude(pd => pd.ClassType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            _logger.LogWarning("Student with ID {StudentId} not found", id);
            return NotFound(new { message = "Student not found" });
        }

        return Ok(MapToDto(student));
    }

    [HttpPost]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentResponseDto>> Create([FromBody] CreateStudentDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        _logger.LogInformation("Creating student: {FirstName} {LastName}", dto.FirstName, dto.LastName);

        AgeGroup? ageGroup = null;
        if (!string.IsNullOrEmpty(dto.AgeGroup) && Enum.TryParse<AgeGroup>(dto.AgeGroup, true, out var parsedAg))
            ageGroup = parsedAg;

        var student = new Student
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Email = dto.Email,
            Phone = dto.Phone,
            DateOfBirth = dto.DateOfBirth,
            AgeGroup = ageGroup,
            CreatedAt = DateTime.UtcNow
        };

        _context.Students.Add(student);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Student {StudentId} created successfully", student.Id);

        return CreatedAtAction(nameof(GetById), new { id = student.Id }, MapToDto(student));
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentResponseDto>> Update(int id, [FromBody] UpdateStudentDto dto)
    {
        _logger.LogInformation("Updating student {StudentId}", id);

        var student = await _context.Students
            .Include(s => s.Attendances)
            .Include(s => s.User)
            .Include(s => s.Parent)
            .Include(s => s.Packages)
                .ThenInclude(sp => sp.PackageDefinition)
                    .ThenInclude(pd => pd.ClassType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            _logger.LogWarning("Student {StudentId} not found for update", id);
            return NotFound(new { message = "Student not found" });
        }

        if (dto.FirstName != null)
            student.FirstName = dto.FirstName;

        if (dto.LastName != null)
            student.LastName = dto.LastName;

        if (dto.Email != null)
            student.Email = dto.Email;

        if (dto.Phone != null)
            student.Phone = dto.Phone;

        if (dto.DateOfBirth.HasValue)
            student.DateOfBirth = dto.DateOfBirth;

        if (dto.AgeGroup != null && Enum.TryParse<AgeGroup>(dto.AgeGroup, true, out var updatedAg))
            student.AgeGroup = updatedAg;

        if (dto.IsActive.HasValue)
            student.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Student {StudentId} updated successfully", id);

        return Ok(MapToDto(student));
    }

    // Admin: Directly link a student to a user (no approval needed)
    [HttpPut("{id}/link")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<StudentResponseDto>> LinkToUser(int id, [FromBody] LinkStudentDto dto)
    {
        _logger.LogInformation("Admin linking student {StudentId} to user {UserId} as {LinkType}", id, dto.UserId, dto.LinkType);

        var student = await _context.Students
            .Include(s => s.Attendances)
            .Include(s => s.User)
            .Include(s => s.Parent)
            .Include(s => s.Packages)
                .ThenInclude(sp => sp.PackageDefinition)
                    .ThenInclude(pd => pd.ClassType)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
            return NotFound(new { message = "Student not found" });

        if (!string.IsNullOrEmpty(dto.UserId))
        {
            var user = await _context.Users.FindAsync(dto.UserId);
            if (user == null)
                return BadRequest(new { message = "User not found" });
        }

        if (dto.LinkType?.ToLower() == "parent")
        {
            student.ParentUserId = string.IsNullOrEmpty(dto.UserId) ? null : dto.UserId;
        }
        else
        {
            student.UserId = string.IsNullOrEmpty(dto.UserId) ? null : dto.UserId;
        }

        await _context.SaveChangesAsync();
        _logger.LogInformation("Student {StudentId} linked successfully", id);

        return Ok(MapToDto(student));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<IActionResult> Delete(int id)
    {
        _logger.LogInformation("Deleting student {StudentId}", id);

        var student = await _context.Students
            .Include(s => s.Attendances)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            _logger.LogWarning("Student {StudentId} not found for deletion", id);
            return NotFound(new { message = "Student not found" });
        }

        if (student.Attendances.Any())
        {
            _logger.LogWarning("Cannot delete student {StudentId} - has attendance records", id);
            return BadRequest(new { message = "Cannot delete student with attendance records. Deactivate instead." });
        }

        _context.Students.Remove(student);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Student {StudentId} deleted successfully", id);
        return NoContent();
    }

    // Admin: Search users for linking
    [HttpGet("search-users")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult> SearchUsers([FromQuery] string? q)
    {
        if (string.IsNullOrWhiteSpace(q) || q.Length < 2)
            return BadRequest(new { message = "Enter at least 2 characters" });

        var qLower = q.ToLower();
        var users = await _context.Users
            .Where(u => (u.FirstName != null && u.FirstName.ToLower().Contains(qLower)) ||
                        (u.LastName != null && u.LastName.ToLower().Contains(qLower)) ||
                        (u.Email != null && u.Email.ToLower().Contains(qLower)))
            .Select(u => new
            {
                u.Id,
                u.FirstName,
                u.LastName,
                u.Email
            })
            .Take(10)
            .ToListAsync();

        return Ok(users);
    }

    private static StudentResponseDto MapToDto(Student s) => new()
    {
        Id = s.Id,
        FirstName = s.FirstName,
        LastName = s.LastName,
        Email = s.Email,
        Phone = s.Phone,
        DateOfBirth = s.DateOfBirth,
        AgeGroup = s.AgeGroup.HasValue ? s.AgeGroup.Value.ToString() : null,
        IsActive = s.IsActive,
        TotalAttendances = s.Attendances?.Count ?? 0,
        UserId = s.UserId,
        LinkedUserName = s.User != null ? (s.User.FirstName ?? "") + " " + (s.User.LastName ?? "") : null,
        ParentUserId = s.ParentUserId,
        ParentName = s.Parent != null ? (s.Parent.FirstName ?? "") + " " + (s.Parent.LastName ?? "") : null,
        CreatedAt = s.CreatedAt,
        EnrolledPackages = s.Packages?
            .OrderByDescending(sp => sp.BillingYear)
            .ThenByDescending(sp => sp.BillingMonth)
            .Select(sp => new EnrolledPackageDto
            {
                Id = sp.Id,
                PackageName = sp.PackageDefinition?.Name ?? "",
                ClassTypeName = sp.PackageDefinition?.ClassType?.Name ?? "",
                BillingPeriod = new DateTime(sp.BillingYear, sp.BillingMonth, 1)
                    .ToString("MMM yyyy", CultureInfo.InvariantCulture)
            })
            .ToList() ?? new()
    };
}
