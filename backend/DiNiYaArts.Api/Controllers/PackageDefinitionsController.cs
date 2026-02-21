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
public class PackageDefinitionsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<PackageDefinitionsController> _logger;

    public PackageDefinitionsController(ApplicationDbContext context, ILogger<PackageDefinitionsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET /api/packagedefinitions?classTypeId=1&activeOnly=true
    [HttpGet]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<PackageDefinitionResponseDto>>> GetAll(
        [FromQuery] int? classTypeId, [FromQuery] bool activeOnly = false)
    {
        var query = _context.PackageDefinitions
            .Include(p => p.ClassType)
            .AsQueryable();

        if (classTypeId.HasValue)
            query = query.Where(p => p.ClassTypeId == classTypeId.Value);

        if (activeOnly)
            query = query.Where(p => p.IsActive);

        var packages = await query
            .OrderBy(p => p.ClassType.Name)
            .ThenBy(p => p.SessionCount)
            .Select(p => new PackageDefinitionResponseDto
            {
                Id = p.Id,
                ClassTypeId = p.ClassTypeId,
                ClassTypeName = p.ClassType.Name,
                Name = p.Name,
                SessionCount = p.SessionCount,
                Price = p.Price,
                IsActive = p.IsActive,
                CreatedAt = p.CreatedAt
            })
            .ToListAsync();

        return Ok(packages);
    }

    // POST /api/packagedefinitions
    [HttpPost]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<PackageDefinitionResponseDto>> Create([FromBody] CreatePackageDefinitionDto dto)
    {
        var classType = await _context.ClassTypes.FindAsync(dto.ClassTypeId);
        if (classType == null)
            return BadRequest(new { message = "Class type not found" });

        var package = new PackageDefinition
        {
            ClassTypeId = dto.ClassTypeId,
            Name = dto.Name,
            SessionCount = dto.SessionCount,
            Price = dto.Price
        };

        _context.PackageDefinitions.Add(package);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Created package definition {PackageId}: {Name}", package.Id, package.Name);

        return Ok(new PackageDefinitionResponseDto
        {
            Id = package.Id,
            ClassTypeId = package.ClassTypeId,
            ClassTypeName = classType.Name,
            Name = package.Name,
            SessionCount = package.SessionCount,
            Price = package.Price,
            IsActive = package.IsActive,
            CreatedAt = package.CreatedAt
        });
    }

    // PUT /api/packagedefinitions/{id}
    [HttpPut("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<ActionResult<PackageDefinitionResponseDto>> Update(int id, [FromBody] UpdatePackageDefinitionDto dto)
    {
        var package = await _context.PackageDefinitions
            .Include(p => p.ClassType)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (package == null)
            return NotFound(new { message = "Package definition not found" });

        if (dto.Name != null) package.Name = dto.Name;
        if (dto.SessionCount.HasValue) package.SessionCount = dto.SessionCount.Value;
        if (dto.Price.HasValue) package.Price = dto.Price.Value;
        if (dto.IsActive.HasValue) package.IsActive = dto.IsActive.Value;

        await _context.SaveChangesAsync();

        _logger.LogInformation("Updated package definition {PackageId}", id);

        return Ok(new PackageDefinitionResponseDto
        {
            Id = package.Id,
            ClassTypeId = package.ClassTypeId,
            ClassTypeName = package.ClassType.Name,
            Name = package.Name,
            SessionCount = package.SessionCount,
            Price = package.Price,
            IsActive = package.IsActive,
            CreatedAt = package.CreatedAt
        });
    }

    // DELETE /api/packagedefinitions/{id}
    [HttpDelete("{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> Delete(int id)
    {
        var package = await _context.PackageDefinitions.FindAsync(id);
        if (package == null)
            return NotFound(new { message = "Package definition not found" });

        // Check if any student packages reference this definition
        var inUse = await _context.StudentPackages.AnyAsync(sp => sp.PackageDefinitionId == id);
        if (inUse)
        {
            // Soft-delete (deactivate)
            package.IsActive = false;
            await _context.SaveChangesAsync();
            _logger.LogInformation("Deactivated package definition {PackageId} (in use)", id);
            return Ok(new { message = "Package deactivated (in use by students)" });
        }

        _context.PackageDefinitions.Remove(package);
        await _context.SaveChangesAsync();
        _logger.LogInformation("Deleted package definition {PackageId}", id);
        return NoContent();
    }
}
