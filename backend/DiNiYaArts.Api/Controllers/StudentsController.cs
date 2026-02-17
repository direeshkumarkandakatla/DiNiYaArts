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

        var students = await query
            .OrderBy(s => s.FirstName)
            .ThenBy(s => s.LastName)
            .Select(s => new StudentResponseDto
            {
                Id = s.Id,
                FirstName = s.FirstName,
                LastName = s.LastName,
                Email = s.Email,
                Phone = s.Phone,
                DateOfBirth = s.DateOfBirth,
                AgeGroup = s.AgeGroup.HasValue ? s.AgeGroup.Value.ToString() : null,
                IsActive = s.IsActive,
                TotalAttendances = s.Attendances.Count,
                CreatedAt = s.CreatedAt
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} students", students.Count);
        return Ok(students);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<StudentResponseDto>> GetById(int id)
    {
        _logger.LogInformation("Fetching student with ID {StudentId}", id);

        var student = await _context.Students
            .Include(s => s.Attendances)
            .FirstOrDefaultAsync(s => s.Id == id);

        if (student == null)
        {
            _logger.LogWarning("Student with ID {StudentId} not found", id);
            return NotFound(new { message = "Student not found" });
        }

        return Ok(new StudentResponseDto
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            Email = student.Email,
            Phone = student.Phone,
            DateOfBirth = student.DateOfBirth,
            AgeGroup = student.AgeGroup.HasValue ? student.AgeGroup.Value.ToString() : null,
            IsActive = student.IsActive,
            TotalAttendances = student.Attendances.Count,
            CreatedAt = student.CreatedAt
        });
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

        return CreatedAtAction(nameof(GetById), new { id = student.Id }, new StudentResponseDto
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            Email = student.Email,
            Phone = student.Phone,
            DateOfBirth = student.DateOfBirth,
            AgeGroup = student.AgeGroup.HasValue ? student.AgeGroup.Value.ToString() : null,
            IsActive = student.IsActive,
            TotalAttendances = 0,
            CreatedAt = student.CreatedAt
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentResponseDto>> Update(int id, [FromBody] UpdateStudentDto dto)
    {
        _logger.LogInformation("Updating student {StudentId}", id);

        var student = await _context.Students
            .Include(s => s.Attendances)
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

        return Ok(new StudentResponseDto
        {
            Id = student.Id,
            FirstName = student.FirstName,
            LastName = student.LastName,
            Email = student.Email,
            Phone = student.Phone,
            DateOfBirth = student.DateOfBirth,
            AgeGroup = student.AgeGroup.HasValue ? student.AgeGroup.Value.ToString() : null,
            IsActive = student.IsActive,
            TotalAttendances = student.Attendances.Count,
            CreatedAt = student.CreatedAt
        });
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
}
