using System.Security.Claims;
using DiNiYaArts.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace DiNiYaArts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Administrator")]
public class UsersController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<UsersController> _logger;

    public UsersController(UserManager<ApplicationUser> userManager, ILogger<UsersController> logger)
    {
        _userManager = userManager;
        _logger = logger;
    }

    // GET /api/users - List all users with their roles
    [HttpGet]
    public async Task<ActionResult> GetAll([FromQuery] string? search)
    {
        var query = _userManager.Users.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.ToLower();
            query = query.Where(u =>
                (u.FirstName != null && u.FirstName.ToLower().Contains(searchLower)) ||
                (u.LastName != null && u.LastName.ToLower().Contains(searchLower)) ||
                (u.Email != null && u.Email.ToLower().Contains(searchLower)));
        }

        var users = await query
            .OrderBy(u => u.FirstName)
            .ThenBy(u => u.LastName)
            .ToListAsync();

        var result = new List<object>();
        foreach (var user in users)
        {
            var roles = await _userManager.GetRolesAsync(user);
            result.Add(new
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                Roles = roles,
                user.IsActive,
                user.CreatedAt,
                user.LastLoginAt
            });
        }

        return Ok(result);
    }

    // GET /api/users/{id} - Get single user with roles
    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(string id)
    {
        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            Roles = roles,
            user.IsActive,
            user.CreatedAt,
            user.LastLoginAt
        });
    }

    // PUT /api/users/{id}/roles - Assign a role to a user
    [HttpPut("{id}/roles")]
    public async Task<ActionResult> AssignRole(string id, [FromBody] RoleChangeDto dto)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("Admin {AdminId} assigning role {Role} to user {UserId}", adminUserId, dto.Role, id);

        var validRoles = new[] { "Administrator", "Instructor", "Student", "Parent" };
        if (!validRoles.Contains(dto.Role))
            return BadRequest(new { message = "Invalid role" });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (await _userManager.IsInRoleAsync(user, dto.Role))
            return BadRequest(new { message = $"User already has the {dto.Role} role" });

        var result = await _userManager.AddToRoleAsync(user, dto.Role);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to assign role", errors = result.Errors });

        _logger.LogInformation("Role {Role} assigned to user {UserId} by admin {AdminId}", dto.Role, id, adminUserId);

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            Roles = roles
        });
    }

    // DELETE /api/users/{id}/roles/{role} - Remove a role from a user
    [HttpDelete("{id}/roles/{role}")]
    public async Task<ActionResult> RemoveRole(string id, string role)
    {
        var adminUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        _logger.LogInformation("Admin {AdminId} removing role {Role} from user {UserId}", adminUserId, role, id);

        var validRoles = new[] { "Administrator", "Instructor", "Student", "Parent" };
        if (!validRoles.Contains(role))
            return BadRequest(new { message = "Invalid role" });

        var user = await _userManager.FindByIdAsync(id);
        if (user == null)
            return NotFound(new { message = "User not found" });

        if (!await _userManager.IsInRoleAsync(user, role))
            return BadRequest(new { message = $"User doesn't have the {role} role" });

        // Self-protection: Admin can't remove their own Administrator role
        if (id == adminUserId && role == "Administrator")
            return BadRequest(new { message = "You cannot remove your own Administrator role" });

        var result = await _userManager.RemoveFromRoleAsync(user, role);
        if (!result.Succeeded)
            return BadRequest(new { message = "Failed to remove role", errors = result.Errors });

        _logger.LogInformation("Role {Role} removed from user {UserId} by admin {AdminId}", role, id, adminUserId);

        var roles = await _userManager.GetRolesAsync(user);
        return Ok(new
        {
            user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            Roles = roles
        });
    }
}

public class RoleChangeDto
{
    public string Role { get; set; } = string.Empty;
}
