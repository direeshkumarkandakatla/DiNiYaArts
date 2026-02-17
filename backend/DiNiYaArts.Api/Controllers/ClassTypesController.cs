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
    public async Task<ActionResult<IEnumerable<ClassTypeResponseDto>>> GetAll()
    {
        _logger.LogInformation("Fetching all active class types");

        var classTypes = await _context.ClassTypes
            .Where(ct => ct.IsActive)
            .Select(ct => new ClassTypeResponseDto
            {
                Id = ct.Id,
                Name = ct.Name,
                Color = ct.Color,
                Description = ct.Description,
                TargetAgeGroup = ct.TargetAgeGroup.ToString(),
                IsActive = ct.IsActive
            })
            .ToListAsync();

        _logger.LogInformation("Retrieved {Count} class types", classTypes.Count);
        return Ok(classTypes);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ClassTypeResponseDto>> GetById(int id)
    {
        _logger.LogInformation("Fetching class type with ID {ClassTypeId}", id);

        var classType = await _context.ClassTypes.FindAsync(id);
        if (classType == null)
        {
            _logger.LogWarning("Class type with ID {ClassTypeId} not found", id);
            return NotFound(new { message = "Class type not found" });
        }

        return Ok(new ClassTypeResponseDto
        {
            Id = classType.Id,
            Name = classType.Name,
            Color = classType.Color,
            Description = classType.Description,
            TargetAgeGroup = classType.TargetAgeGroup.ToString(),
            IsActive = classType.IsActive
        });
    }
}
