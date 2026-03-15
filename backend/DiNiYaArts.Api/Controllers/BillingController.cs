using System.Globalization;
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
public class BillingController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<BillingController> _logger;

    public BillingController(ApplicationDbContext context, ILogger<BillingController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // GET /api/billing/packages?year=2026&month=2&studentId=1
    [HttpGet("packages")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<StudentPackageResponseDto>>> GetPackages(
        [FromQuery] int? year, [FromQuery] int? month, [FromQuery] int? studentId)
    {
        var query = _context.StudentPackages
            .Include(sp => sp.Student)
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .AsQueryable();

        if (year.HasValue) query = query.Where(sp => sp.BillingYear == year.Value);
        if (month.HasValue) query = query.Where(sp => sp.BillingMonth == month.Value);
        if (studentId.HasValue) query = query.Where(sp => sp.StudentId == studentId.Value);

        var packages = await query
            .OrderBy(sp => sp.Student.FirstName)
            .ThenBy(sp => sp.BillingYear)
            .ThenBy(sp => sp.BillingMonth)
            .ToListAsync();

        var result = new List<StudentPackageResponseDto>();
        foreach (var sp in packages)
        {
            var attended = await GetSessionsAttended(sp.StudentId, sp.PackageDefinition.ClassTypeId, sp.BillingYear, sp.BillingMonth);
            result.Add(MapToPackageDto(sp, attended));
        }

        return Ok(result);
    }

    // POST /api/billing/packages
    [HttpPost("packages")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<StudentPackageResponseDto>> EnrollPackage([FromBody] EnrollStudentPackageDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var student = await _context.Students.FindAsync(dto.StudentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        var packageDef = await _context.PackageDefinitions
            .Include(p => p.ClassType)
            .FirstOrDefaultAsync(p => p.Id == dto.PackageDefinitionId);
        if (packageDef == null)
            return NotFound(new { message = "Package definition not found" });

        // Check for duplicate enrollment
        var exists = await _context.StudentPackages.AnyAsync(sp =>
            sp.StudentId == dto.StudentId &&
            sp.PackageDefinitionId == dto.PackageDefinitionId &&
            sp.BillingYear == dto.BillingYear &&
            sp.BillingMonth == dto.BillingMonth);

        if (exists)
            return BadRequest(new { message = "Student is already enrolled in this package for this billing period" });

        var enrollment = new StudentPackage
        {
            StudentId = dto.StudentId,
            PackageDefinitionId = dto.PackageDefinitionId,
            BillingYear = dto.BillingYear,
            BillingMonth = dto.BillingMonth,
            PackagePrice = packageDef.Price,
            SessionCount = packageDef.SessionCount,
            CreatedByUserId = userId
        };

        _context.StudentPackages.Add(enrollment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} enrolled student {StudentId} in package {PackageId} for {Year}/{Month}",
            userId, dto.StudentId, dto.PackageDefinitionId, dto.BillingYear, dto.BillingMonth);

        // Reload with includes
        enrollment = await _context.StudentPackages
            .Include(sp => sp.Student)
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .FirstAsync(sp => sp.Id == enrollment.Id);

        var attended = await GetSessionsAttended(enrollment.StudentId, enrollment.PackageDefinition.ClassTypeId, enrollment.BillingYear, enrollment.BillingMonth);
        return Ok(MapToPackageDto(enrollment, attended));
    }

    // POST /api/billing/packages/bulk
    [HttpPost("packages/bulk")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<StudentPackageResponseDto>>> BulkEnrollPackage([FromBody] BulkEnrollStudentPackageDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var packageDef = await _context.PackageDefinitions
            .Include(p => p.ClassType)
            .FirstOrDefaultAsync(p => p.Id == dto.PackageDefinitionId);
        if (packageDef == null)
            return NotFound(new { message = "Package definition not found" });

        var enrollments = new List<StudentPackage>();
        var skipped = new List<int>();

        foreach (var studentId in dto.StudentIds)
        {
            var studentExists = await _context.Students.AnyAsync(s => s.Id == studentId);
            if (!studentExists) { skipped.Add(studentId); continue; }

            var exists = await _context.StudentPackages.AnyAsync(sp =>
                sp.StudentId == studentId &&
                sp.PackageDefinitionId == dto.PackageDefinitionId &&
                sp.BillingYear == dto.BillingYear &&
                sp.BillingMonth == dto.BillingMonth);

            if (exists) { skipped.Add(studentId); continue; }

            var enrollment = new StudentPackage
            {
                StudentId = studentId,
                PackageDefinitionId = dto.PackageDefinitionId,
                BillingYear = dto.BillingYear,
                BillingMonth = dto.BillingMonth,
                PackagePrice = packageDef.Price,
                SessionCount = packageDef.SessionCount,
                CreatedByUserId = userId
            };

            _context.StudentPackages.Add(enrollment);
            enrollments.Add(enrollment);
        }

        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} bulk enrolled {Count} students in package {PackageId} for {Year}/{Month} (skipped: {Skipped})",
            userId, enrollments.Count, dto.PackageDefinitionId, dto.BillingYear, dto.BillingMonth, skipped.Count);

        // Reload with includes
        var ids = enrollments.Select(e => e.Id).ToList();
        var loaded = await _context.StudentPackages
            .Include(sp => sp.Student)
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .Where(sp => ids.Contains(sp.Id))
            .ToListAsync();

        var result = new List<StudentPackageResponseDto>();
        foreach (var sp in loaded)
        {
            var attended = await GetSessionsAttended(sp.StudentId, sp.PackageDefinition.ClassTypeId, sp.BillingYear, sp.BillingMonth);
            result.Add(MapToPackageDto(sp, attended));
        }

        return Ok(result);
    }

    // DELETE /api/billing/packages/{id}
    [HttpDelete("packages/{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeletePackage(int id)
    {
        var package = await _context.StudentPackages.FindAsync(id);
        if (package == null)
            return NotFound(new { message = "Student package not found" });

        _context.StudentPackages.Remove(package);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted student package {PackageId}", id);
        return NoContent();
    }

    // GET /api/billing/payments?studentId=1&from=2026-01-01&to=2026-02-28
    [HttpGet("payments")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<IEnumerable<PaymentResponseDto>>> GetPayments(
        [FromQuery] int? studentId, [FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _context.Payments
            .Include(p => p.Student)
            .Include(p => p.RecordedBy)
            .AsQueryable();

        if (studentId.HasValue) query = query.Where(p => p.StudentId == studentId.Value);
        if (from.HasValue) query = query.Where(p => p.PaymentDate >= from.Value);
        if (to.HasValue) query = query.Where(p => p.PaymentDate <= to.Value);

        var payments = await query
            .OrderByDescending(p => p.PaymentDate)
            .Select(p => new PaymentResponseDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                StudentName = p.Student.FirstName + " " + p.Student.LastName,
                Amount = p.Amount,
                Discount = p.Discount,
                PaymentDate = p.PaymentDate,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                RecordedByName = p.RecordedBy.FirstName + " " + p.RecordedBy.LastName
            })
            .ToListAsync();

        return Ok(payments);
    }

    // POST /api/billing/payments
    [HttpPost("payments")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<PaymentResponseDto>> RecordPayment([FromBody] RecordPaymentDto dto)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var student = await _context.Students.FindAsync(dto.StudentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        var payment = new Payment
        {
            StudentId = dto.StudentId,
            Amount = dto.Amount,
            Discount = dto.Discount,
            PaymentDate = dto.PaymentDate,
            Notes = dto.Notes,
            RecordedByUserId = userId
        };

        _context.Payments.Add(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("User {UserId} recorded payment of {Amount} (discount: {Discount}) for student {StudentId}",
            userId, dto.Amount, dto.Discount, dto.StudentId);

        var user = await _context.Users.FindAsync(userId);

        return Ok(new PaymentResponseDto
        {
            Id = payment.Id,
            StudentId = payment.StudentId,
            StudentName = $"{student.FirstName} {student.LastName}",
            Amount = payment.Amount,
            Discount = payment.Discount,
            PaymentDate = payment.PaymentDate,
            Notes = payment.Notes,
            CreatedAt = payment.CreatedAt,
            RecordedByName = user != null ? $"{user.FirstName} {user.LastName}" : "Unknown"
        });
    }

    // DELETE /api/billing/payments/{id}
    [HttpDelete("payments/{id}")]
    [Authorize(Roles = "Administrator")]
    public async Task<IActionResult> DeletePayment(int id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null)
            return NotFound(new { message = "Payment not found" });

        _context.Payments.Remove(payment);
        await _context.SaveChangesAsync();

        _logger.LogInformation("Deleted payment {PaymentId}", id);
        return NoContent();
    }

    // GET /api/billing/summary?year=2026&month=2
    [HttpGet("summary")]
    [Authorize(Roles = "Administrator,Instructor")]
    public async Task<ActionResult<BillingSummaryDto>> GetSummary([FromQuery] int? year, [FromQuery] int? month)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        var monthStart = new DateTime(targetYear, targetMonth, 1);
        var monthEnd = monthStart.AddMonths(1);

        // Find ALL students with billable attendance in the month
        var attendanceStudentIds = await _context.Attendances
            .Include(a => a.Session)
            .Where(a =>
                a.Session.StartDateTime >= monthStart &&
                a.Session.StartDateTime < monthEnd &&
                (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
            .Select(a => a.StudentId)
            .Distinct()
            .ToListAsync();

        // Also include students with packages (even if no attendance yet)
        var packageStudentIds = await _context.StudentPackages
            .Where(sp => sp.BillingYear == targetYear && sp.BillingMonth == targetMonth)
            .Select(sp => sp.StudentId)
            .Distinct()
            .ToListAsync();

        // Also include students with payments
        var paymentStudentIds = await _context.Payments
            .Where(p => p.PaymentDate >= monthStart && p.PaymentDate < monthEnd)
            .Select(p => p.StudentId)
            .Distinct()
            .ToListAsync();

        var studentIds = attendanceStudentIds
            .Union(packageStudentIds)
            .Union(paymentStudentIds)
            .Distinct()
            .ToList();

        // Build balance for each student
        var studentBalances = new List<StudentBalanceDto>();
        foreach (var studentId in studentIds)
        {
            var balance = await BuildStudentBalance(studentId, targetYear, targetMonth);
            studentBalances.Add(balance);
        }

        // Collected this month (materialize for SQLite decimal compatibility)
        var collectedThisMonth = (await _context.Payments
            .Where(p => p.PaymentDate >= monthStart && p.PaymentDate < monthEnd)
            .Select(p => p.Amount)
            .ToListAsync())
            .Sum();

        return Ok(new BillingSummaryDto
        {
            TotalOutstanding = studentBalances.Sum(b => Math.Max(0, b.OutstandingBalance)),
            BilledThisMonth = studentBalances.Sum(b => b.SessionCharges.Sum(sc => sc.ChargeAmount)),
            CollectedThisMonth = collectedThisMonth,
            StudentsWithDues = studentBalances.Count(b => b.OutstandingBalance > 0),
            StudentBalances = studentBalances.OrderByDescending(b => b.OutstandingBalance).ToList()
        });
    }

    // GET /api/billing/student/{studentId}?year=2026&month=2
    [HttpGet("student/{studentId}")]
    public async Task<ActionResult<StudentBalanceDto>> GetStudentBalance(int studentId, [FromQuery] int? year, [FromQuery] int? month)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null)
            return NotFound(new { message = "Student not found" });

        // Access control
        if (!CanAccessStudent(student))
            return Forbid();

        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;

        return Ok(await BuildStudentBalance(studentId, targetYear, targetMonth));
    }

    // GET /api/billing/my
    [HttpGet("my")]
    [Authorize(Roles = "Parent,Student")]
    public async Task<ActionResult<ParentBillingSummaryDto>> GetMyBilling()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier)!;

        var linkedStudents = await _context.Students
            .Where(s => s.UserId == userId || s.ParentUserId == userId)
            .ToListAsync();

        var children = new List<StudentBalanceDto>();
        foreach (var student in linkedStudents)
        {
            var balance = await BuildStudentBalanceAllTime(student.Id);
            children.Add(balance);
        }

        return Ok(new ParentBillingSummaryDto
        {
            TotalOutstanding = children.Sum(c => Math.Max(0, c.OutstandingBalance)),
            TotalPaid = children.Sum(c => c.TotalPayments + c.TotalDiscounts),
            Children = children
        });
    }

    // --- Helpers ---

    private async Task<int> GetSessionsAttended(int studentId, int classTypeId, int billingYear, int billingMonth)
    {
        var monthStart = new DateTime(billingYear, billingMonth, 1);
        var monthEnd = monthStart.AddMonths(1);

        return await _context.Attendances
            .Include(a => a.Session)
            .Where(a =>
                a.StudentId == studentId &&
                a.Session.ClassTypeId == classTypeId &&
                a.Session.StartDateTime >= monthStart &&
                a.Session.StartDateTime < monthEnd &&
                (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
            .CountAsync();
    }

    private static StudentPackageResponseDto MapToPackageDto(StudentPackage sp, int sessionsAttended)
    {
        var cappedAttended = Math.Min(sessionsAttended, sp.SessionCount);
        var proratedAmount = sp.SessionCount > 0
            ? Math.Round((sp.PackagePrice / sp.SessionCount) * cappedAttended, 2)
            : 0;

        return new StudentPackageResponseDto
        {
            Id = sp.Id,
            StudentId = sp.StudentId,
            StudentName = $"{sp.Student.FirstName} {sp.Student.LastName}",
            PackageDefinitionId = sp.PackageDefinitionId,
            PackageName = sp.PackageDefinition.Name,
            ClassTypeName = sp.PackageDefinition.ClassType.Name,
            BillingYear = sp.BillingYear,
            BillingMonth = sp.BillingMonth,
            BillingPeriod = new DateTime(sp.BillingYear, sp.BillingMonth, 1).ToString("MMM yyyy", CultureInfo.InvariantCulture),
            PackagePrice = sp.PackagePrice,
            SessionCount = sp.SessionCount,
            SessionsAttended = sessionsAttended,
            ProratedAmount = proratedAmount,
            IsOverage = sessionsAttended > sp.SessionCount,
            CreatedAt = sp.CreatedAt
        };
    }

    /// <summary>
    /// Builds session-level charges for a student in a given month.
    /// For each classType attended:
    ///   - If student has a package: first N sessions at package rate, extras at default rate
    ///   - If no package: all sessions at ClassType.DefaultSessionPrice
    /// </summary>
    private async Task<(List<SessionChargeDto> Charges, decimal TotalDues)> BuildSessionCharges(
        int studentId, int billingYear, int billingMonth)
    {
        var monthStart = new DateTime(billingYear, billingMonth, 1);
        var monthEnd = monthStart.AddMonths(1);

        // Get ALL billable attendance for the student in the month
        var attendances = await _context.Attendances
            .Include(a => a.Session)
                .ThenInclude(s => s.ClassType)
            .Where(a =>
                a.StudentId == studentId &&
                a.Session.StartDateTime >= monthStart &&
                a.Session.StartDateTime < monthEnd &&
                (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
            .OrderBy(a => a.Session.StartDateTime)
            .ToListAsync();

        // Get packages for the student in this month
        var packages = await _context.StudentPackages
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .Where(sp => sp.StudentId == studentId && sp.BillingYear == billingYear && sp.BillingMonth == billingMonth)
            .ToListAsync();

        // Build a lookup: classTypeId -> package
        var packageByClassType = packages
            .GroupBy(sp => sp.PackageDefinition.ClassTypeId)
            .ToDictionary(g => g.Key, g => g.First());

        // Group attendance by class type
        var groupedByClassType = attendances.GroupBy(a => a.Session.ClassTypeId);

        var charges = new List<SessionChargeDto>();
        decimal totalDues = 0;

        foreach (var group in groupedByClassType)
        {
            var classTypeId = group.Key;
            var classType = group.First().Session.ClassType;
            var sessionList = group.OrderBy(a => a.Session.StartDateTime).ToList();

            if (packageByClassType.TryGetValue(classTypeId, out var pkg))
            {
                // Has package for this class type
                var packageRate = pkg.SessionCount > 0
                    ? Math.Round(pkg.PackagePrice / pkg.SessionCount, 2)
                    : 0;
                var packageName = pkg.PackageDefinition.Name;

                for (int i = 0; i < sessionList.Count; i++)
                {
                    var att = sessionList[i];
                    decimal chargeAmount;
                    string chargeSource;

                    if (i < pkg.SessionCount)
                    {
                        // Covered by package
                        chargeAmount = packageRate;
                        chargeSource = $"Package: {packageName}";
                    }
                    else
                    {
                        // Extra session beyond package
                        chargeAmount = classType.DefaultSessionPrice;
                        chargeSource = "Default Rate (Extra)";
                    }

                    charges.Add(new SessionChargeDto
                    {
                        SessionId = att.SessionId,
                        SessionDate = att.Session.StartDateTime,
                        ClassTypeName = classType.Name,
                        ClassTypeColor = classType.Color,
                        ChargeAmount = chargeAmount,
                        ChargeSource = chargeSource,
                        AttendanceStatus = att.Status.ToString()
                    });
                    totalDues += chargeAmount;
                }
            }
            else
            {
                // No package — charge at default rate
                foreach (var att in sessionList)
                {
                    var chargeAmount = classType.DefaultSessionPrice;
                    charges.Add(new SessionChargeDto
                    {
                        SessionId = att.SessionId,
                        SessionDate = att.Session.StartDateTime,
                        ClassTypeName = classType.Name,
                        ClassTypeColor = classType.Color,
                        ChargeAmount = chargeAmount,
                        ChargeSource = "Default Rate",
                        AttendanceStatus = att.Status.ToString()
                    });
                    totalDues += chargeAmount;
                }
            }
        }

        return (charges, totalDues);
    }

    private async Task<StudentBalanceDto> BuildStudentBalance(int studentId, int targetYear, int targetMonth)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return new StudentBalanceDto();

        // Get packages for the target month (for display)
        var packages = await _context.StudentPackages
            .Include(sp => sp.Student)
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .Where(sp => sp.StudentId == studentId && sp.BillingYear == targetYear && sp.BillingMonth == targetMonth)
            .ToListAsync();

        var packageDtos = new List<StudentPackageResponseDto>();
        foreach (var sp in packages)
        {
            var attended = await GetSessionsAttended(sp.StudentId, sp.PackageDefinition.ClassTypeId, sp.BillingYear, sp.BillingMonth);
            packageDtos.Add(MapToPackageDto(sp, attended));
        }

        // Build session charges for the target month
        var (sessionCharges, monthlyDues) = await BuildSessionCharges(studentId, targetYear, targetMonth);

        // Compute all-time dues from session charges across all months
        decimal allTimeDues = await ComputeAllTimeDues(studentId);

        // Get all payments for this student (all-time, materialize for SQLite decimal compatibility)
        var studentPayments = await _context.Payments
            .Where(p => p.StudentId == studentId)
            .Select(p => new { p.Amount, p.Discount })
            .ToListAsync();
        var totalPayments = studentPayments.Sum(p => p.Amount);
        var totalDiscounts = studentPayments.Sum(p => p.Discount);

        // Monthly payments (for the target month)
        var monthStart = new DateTime(targetYear, targetMonth, 1);
        var monthEnd = monthStart.AddMonths(1);
        var monthlyPaymentData = await _context.Payments
            .Where(p => p.StudentId == studentId && p.PaymentDate >= monthStart && p.PaymentDate < monthEnd)
            .Select(p => new { p.Amount, p.Discount })
            .ToListAsync();
        var monthlyPayments = monthlyPaymentData.Sum(p => p.Amount);
        var monthlyDiscounts = monthlyPaymentData.Sum(p => p.Discount);

        // Recent payments
        var recentPayments = await _context.Payments
            .Include(p => p.RecordedBy)
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .Select(p => new PaymentResponseDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                StudentName = student.FirstName + " " + student.LastName,
                Amount = p.Amount,
                Discount = p.Discount,
                PaymentDate = p.PaymentDate,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                RecordedByName = p.RecordedBy.FirstName + " " + p.RecordedBy.LastName
            })
            .ToListAsync();

        return new StudentBalanceDto
        {
            StudentId = studentId,
            StudentName = $"{student.FirstName} {student.LastName}",
            TotalDues = allTimeDues,
            TotalPayments = totalPayments,
            TotalDiscounts = totalDiscounts,
            OutstandingBalance = allTimeDues - totalPayments - totalDiscounts,
            MonthlyDues = monthlyDues,
            MonthlyPayments = monthlyPayments,
            MonthlyDiscounts = monthlyDiscounts,
            Packages = packageDtos,
            SessionCharges = sessionCharges,
            RecentPayments = recentPayments
        };
    }

    private async Task<StudentBalanceDto> BuildStudentBalanceAllTime(int studentId)
    {
        var student = await _context.Students.FindAsync(studentId);
        if (student == null) return new StudentBalanceDto();

        // Get all packages for display
        var allPackages = await _context.StudentPackages
            .Include(sp => sp.Student)
            .Include(sp => sp.PackageDefinition)
                .ThenInclude(pd => pd.ClassType)
            .Where(sp => sp.StudentId == studentId)
            .OrderByDescending(sp => sp.BillingYear)
            .ThenByDescending(sp => sp.BillingMonth)
            .ToListAsync();

        var packageDtos = new List<StudentPackageResponseDto>();
        foreach (var sp in allPackages)
        {
            var attended = await GetSessionsAttended(sp.StudentId, sp.PackageDefinition.ClassTypeId, sp.BillingYear, sp.BillingMonth);
            packageDtos.Add(MapToPackageDto(sp, attended));
        }

        // Compute all-time dues
        decimal allTimeDues = await ComputeAllTimeDues(studentId);

        // Build session charges for display — get the distinct months with attendance
        var allSessionCharges = new List<SessionChargeDto>();
        var monthsWithAttendance = await _context.Attendances
            .Include(a => a.Session)
            .Where(a =>
                a.StudentId == studentId &&
                (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
            .Select(a => new { a.Session.StartDateTime.Year, a.Session.StartDateTime.Month })
            .Distinct()
            .ToListAsync();

        foreach (var ym in monthsWithAttendance)
        {
            var (charges, _) = await BuildSessionCharges(studentId, ym.Year, ym.Month);
            allSessionCharges.AddRange(charges);
        }

        var allTimePayments = await _context.Payments
            .Where(p => p.StudentId == studentId)
            .Select(p => new { p.Amount, p.Discount })
            .ToListAsync();
        var totalPayments = allTimePayments.Sum(p => p.Amount);
        var totalDiscounts = allTimePayments.Sum(p => p.Discount);

        var recentPayments = await _context.Payments
            .Include(p => p.RecordedBy)
            .Where(p => p.StudentId == studentId)
            .OrderByDescending(p => p.PaymentDate)
            .Take(10)
            .Select(p => new PaymentResponseDto
            {
                Id = p.Id,
                StudentId = p.StudentId,
                StudentName = student.FirstName + " " + student.LastName,
                Amount = p.Amount,
                Discount = p.Discount,
                PaymentDate = p.PaymentDate,
                Notes = p.Notes,
                CreatedAt = p.CreatedAt,
                RecordedByName = p.RecordedBy.FirstName + " " + p.RecordedBy.LastName
            })
            .ToListAsync();

        return new StudentBalanceDto
        {
            StudentId = studentId,
            StudentName = $"{student.FirstName} {student.LastName}",
            TotalDues = allTimeDues,
            TotalPayments = totalPayments,
            TotalDiscounts = totalDiscounts,
            OutstandingBalance = allTimeDues - totalPayments - totalDiscounts,
            Packages = packageDtos,
            SessionCharges = allSessionCharges.OrderByDescending(c => c.SessionDate).ToList(),
            RecentPayments = recentPayments
        };
    }

    /// <summary>
    /// Compute total dues across all months for a student using session-level charging.
    /// </summary>
    private async Task<decimal> ComputeAllTimeDues(int studentId)
    {
        // Find all distinct year/month combos where the student has billable attendance
        var monthsWithAttendance = await _context.Attendances
            .Include(a => a.Session)
            .Where(a =>
                a.StudentId == studentId &&
                (a.Status == AttendanceStatus.Present || a.Status == AttendanceStatus.Late))
            .Select(a => new { a.Session.StartDateTime.Year, a.Session.StartDateTime.Month })
            .Distinct()
            .ToListAsync();

        decimal totalDues = 0;
        foreach (var ym in monthsWithAttendance)
        {
            var (_, dues) = await BuildSessionCharges(studentId, ym.Year, ym.Month);
            totalDues += dues;
        }

        return totalDues;
    }

    private bool CanAccessStudent(Student student)
    {
        var isAdmin = User.IsInRole("Administrator");
        var isInstructor = User.IsInRole("Instructor");
        if (isAdmin || isInstructor)
            return true;

        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return student.UserId == userId || student.ParentUserId == userId;
    }
}
