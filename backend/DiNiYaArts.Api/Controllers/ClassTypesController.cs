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
public class ClassTypesController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<ClassTypesController> _logger;

    public ClassTypesController(ApplicationDbContext context, ILogger<ClassTypesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ClassTypeResponseDto>>> GetAll([FromQuery] bool includeInactive = false)
    {
        var query = _context.ClassTypes.AsQueryable();

        if (!includeInactive)
            query = query.Where(ct => ct.IsActive);

        var classTypes = await query
            .OrderBy(ct => ct.Name)
            .Select(ct => new ClassTypeResponseDto
            {
                Id = ct.Id,
                Name = ct.Name,
                Color = ct.Color,
                Description = ct.Description,
                TargetAgeGroup = ct.TargetAgeGroup.ToString(),
                DefaultSessionPrice = ct.DefaultSessionPrice,
                IsActive = ct.IsActive
            })
            .ToListAsync();

        return Ok(classTypes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassTypeResponseDto>> GetById(int id)
    {
        var classType = await _context.ClassTypes.FindAsync(id);
        if (classType == null)
            return NotFound(new { message = "Class type not found" });

        return Ok(new ClassTypeResponseDto
        {
            Id = classType.Id,
            Name = classType.Name,
            Color = classType.Color,
            Description = classType.Description,
            TargetAgeGroup = classType.TargetAgeGroup.ToString(),
            DefaultSessionPrice = classType.DefaultSessionPrice,
            IsActive = classType.IsActive
        });
    }

    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<ClassTypeResponseDto>> Create([FromBody] CreateClassTypeDto dto)
    {
        if (!Enum.TryParse<AgeGroup>(dto.TargetAgeGroup, true, out var ageGroup))
            return BadRequest(new { message = "Invalid age group" });

        var classType = new ClassType
        {
            Name = dto.Name,
            Color = dto.Color,
            Description = dto.Description,
            TargetAgeGroup = ageGroup,
            DefaultSessionPrice = dto.DefaultSessionPrice,
            IsActive = true
        };

        _context.ClassTypes.Add(classType);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created class type {ClassTypeId}: {Name}", classType.Id, classType.Name);

        return Ok(new ClassTypeResponseDto
        {
            Id = classType.Id,
            Name = classType.Name,
            Color = classType.Color,
            Description = classType.Description,
            TargetAgeGroup = classType.TargetAgeGroup.ToString(),
            DefaultSessionPrice = classType.DefaultSessionPrice,
            IsActive = classType.IsActive
        });
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<ClassTypeResponseDto>> Update(int id, [FromBody] UpdateClassTypeDto dto)
    {
        var classType = await _context.ClassTypes.FindAsync(id);
        if (classType == null)
            return NotFound(new { message = "Class type not found" });

        if (dto.Name != null) classType.Name = dto.Name;
        if (dto.Color != null) classType.Color = dto.Color;
        if (dto.Description != null) classType.Description = dto.Description;
        if (dto.DefaultSessionPrice.HasValue) classType.DefaultSessionPrice = dto.DefaultSessionPrice.Value;
        if (dto.IsActive.HasValue) classType.IsActive = dto.IsActive.Value;

        if (dto.TargetAgeGroup != null)
        {
            if (!Enum.TryParse<AgeGroup>(dto.TargetAgeGroup, true, out var ageGroup))
                return BadRequest(new { message = "Invalid age group" });
            classType.TargetAgeGroup = ageGroup;
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated class type {ClassTypeId}", id);

        return Ok(new ClassTypeResponseDto
        {
            Id = classType.Id,
            Name = classType.Name,
            Color = classType.Color,
            Description = classType.Description,
            TargetAgeGroup = classType.TargetAgeGroup.ToString(),
            DefaultSessionPrice = classType.DefaultSessionPrice,
            IsActive = classType.IsActive
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var classType = await _context.ClassTypes
            .Include(ct => ct.Sessions)
            .FirstOrDefaultAsync(ct => ct.Id == id);

        if (classType == null)
            return NotFound(new { message = "Class type not found" });

        if (classType.Sessions.Any())
        {
            // Soft-delete if sessions exist
            classType.IsActive = false;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Soft-deleted class type {ClassTypeId} (has sessions)", id);
            return Ok(new { message = "Class type deactivated (has existing sessions)" });
        }

        _context.ClassTypes.Remove(classType);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Hard-deleted class type {ClassTypeId}", id);
        return NoContent();
    }
}
