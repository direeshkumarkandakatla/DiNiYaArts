using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using DiNiYaArts.Api.DTOs;
using DiNiYaArts.Api.Models;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace DiNiYaArts.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly SignInManager<ApplicationUser> _signInManager;
    private readonly IConfiguration _configuration;
    private readonly ILogger<AuthController> _logger;

    public AuthController(
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signInManager,
        IConfiguration configuration,
        ILogger<AuthController> logger)
    {
        _userManager = userManager;
        _signInManager = signInManager;
        _configuration = configuration;
        _logger = logger;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = new ApplicationUser
        {
            UserName = model.Email,
            Email = model.Email,
            FirstName = model.FirstName,
            LastName = model.LastName,
            CreatedAt = DateTime.UtcNow
        };

        var result = await _userManager.CreateAsync(user, model.Password);

        if (!result.Succeeded)
            return BadRequest(new { errors = result.Errors });

        // No role assigned at registration — roles are assigned via:
        // - Link request approval (Student/Parent)
        // - Admin user management (Instructor/Administrator)

        var token = await GenerateJwtToken(user);

        return Ok(token);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto model)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var user = await _userManager.FindByEmailAsync(model.Email);
        if (user == null)
            return Unauthorized(new { message = "Invalid email or password" });

        if (!user.IsActive)
            return Unauthorized(new { message = "Account is deactivated" });

        var result = await _signInManager.CheckPasswordSignInAsync(user, model.Password, false);

        if (!result.Succeeded)
            return Unauthorized(new { message = "Invalid email or password" });

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var token = await GenerateJwtToken(user);

        return Ok(token);
    }

    [HttpGet("me")]
    [Microsoft.AspNetCore.Authorization.Authorize]
    public async Task<IActionResult> GetCurrentUser()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (userId == null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);
        if (user == null)
            return NotFound();

        var roles = await _userManager.GetRolesAsync(user);

        return Ok(new
        {
            UserId = user.Id,
            user.Email,
            user.FirstName,
            user.LastName,
            user.ProfileImageUrl,
            Roles = roles
        });
    }

    [HttpGet("external-login")]
    public IActionResult ExternalLogin([FromQuery] string provider)
    {
        if (!string.Equals(provider, "Google", StringComparison.OrdinalIgnoreCase))
            return BadRequest(new { message = "Invalid provider" });

        var redirectUrl = Url.Action(nameof(ExternalLoginCallback), "Auth");
        var properties = _signInManager.ConfigureExternalAuthenticationProperties(provider, redirectUrl);
        return Challenge(properties, provider);
    }

    [HttpGet("external-login-callback")]
    public async Task<IActionResult> ExternalLoginCallback()
    {
        var frontendUrl = _configuration["FrontendUrl"] ?? "http://localhost:5173";

        ExternalLoginInfo? info;
        try
        {
            info = await _signInManager.GetExternalLoginInfoAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting external login info");
            return Redirect($"{frontendUrl}/auth/callback?error=external_login_failed");
        }

        if (info == null)
            return Redirect($"{frontendUrl}/auth/callback?error=external_login_failed");

        var email = info.Principal.FindFirstValue(ClaimTypes.Email);
        if (string.IsNullOrEmpty(email))
            return Redirect($"{frontendUrl}/auth/callback?error=email_not_provided");

        var firstName = info.Principal.FindFirstValue(ClaimTypes.GivenName) ?? "";
        var lastName = info.Principal.FindFirstValue(ClaimTypes.Surname) ?? "";

        // Try to find user by external login
        var user = await _userManager.FindByLoginAsync(info.LoginProvider, info.ProviderKey);

        if (user == null)
        {
            // Try to find by email (auto-link)
            user = await _userManager.FindByEmailAsync(email);

            if (user != null)
            {
                // Link provider to existing account
                var addLoginResult = await _userManager.AddLoginAsync(user, info);
                if (!addLoginResult.Succeeded)
                {
                    _logger.LogWarning("Failed to link {Provider} to user {Email}: {Errors}",
                        info.LoginProvider, email,
                        string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                    return Redirect($"{frontendUrl}/auth/callback?error=link_failed");
                }
            }
            else
            {
                // Create new user
                user = new ApplicationUser
                {
                    UserName = email,
                    Email = email,
                    FirstName = firstName,
                    LastName = lastName,
                    EmailConfirmed = true,
                    CreatedAt = DateTime.UtcNow
                };

                var createResult = await _userManager.CreateAsync(user);
                if (!createResult.Succeeded)
                {
                    _logger.LogWarning("Failed to create user for {Provider} login {Email}: {Errors}",
                        info.LoginProvider, email,
                        string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    return Redirect($"{frontendUrl}/auth/callback?error=account_creation_failed");
                }

                var addLoginResult = await _userManager.AddLoginAsync(user, info);
                if (!addLoginResult.Succeeded)
                {
                    _logger.LogWarning("Failed to add {Provider} login for new user {Email}: {Errors}",
                        info.LoginProvider, email,
                        string.Join(", ", addLoginResult.Errors.Select(e => e.Description)));
                }
            }
        }

        if (!user.IsActive)
            return Redirect($"{frontendUrl}/auth/callback?error=account_deactivated");

        // Update last login
        user.LastLoginAt = DateTime.UtcNow;
        await _userManager.UpdateAsync(user);

        var tokenResponse = await GenerateJwtToken(user);
        return Redirect($"{frontendUrl}/auth/callback?token={tokenResponse.Token}");
    }

    private async Task<AuthResponseDto> GenerateJwtToken(ApplicationUser user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var secretKey = jwtSettings["Secret"]!;
        var expirationMinutes = int.Parse(jwtSettings["ExpirationInMinutes"]!);

        var roles = await _userManager.GetRolesAsync(user);

        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id),
            new Claim(ClaimTypes.Email, user.Email!),
            new Claim(ClaimTypes.Name, $"{user.FirstName} {user.LastName}"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        // Add roles as claims
        claims.AddRange(roles.Select(role => new Claim(ClaimTypes.Role, role)));

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(expirationMinutes);

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: credentials
        );

        return new AuthResponseDto
        {
            Token = new JwtSecurityTokenHandler().WriteToken(token),
            UserId = user.Id,
            Email = user.Email!,
            FirstName = user.FirstName ?? string.Empty,
            LastName = user.LastName ?? string.Empty,
            Roles = roles.ToList(),
            ExpiresAt = expiresAt
        };
    }
}
