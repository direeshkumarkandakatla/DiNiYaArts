using System.ComponentModel.DataAnnotations;

namespace DiNiYaArts.Api.DTOs;

// --- Package Definitions ---

public class PackageDefinitionResponseDto
{
    public int Id { get; set; }
    public int ClassTypeId { get; set; }
    public string ClassTypeName { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public int SessionCount { get; set; }
    public decimal Price { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class CreatePackageDefinitionDto
{
    [Required]
    public int ClassTypeId { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required]
    [Range(1, 100)]
    public int SessionCount { get; set; }

    [Required]
    [Range(0.01, 99999.99)]
    public decimal Price { get; set; }
}

public class UpdatePackageDefinitionDto
{
    [StringLength(100)]
    public string? Name { get; set; }

    [Range(1, 100)]
    public int? SessionCount { get; set; }

    [Range(0.01, 99999.99)]
    public decimal? Price { get; set; }

    public bool? IsActive { get; set; }
}

// --- Student Packages (Enrollment) ---

public class StudentPackageResponseDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public int PackageDefinitionId { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public string ClassTypeName { get; set; } = string.Empty;
    public int BillingYear { get; set; }
    public int BillingMonth { get; set; }
    public string BillingPeriod { get; set; } = string.Empty; // e.g., "Feb 2026"
    public decimal PackagePrice { get; set; }
    public int SessionCount { get; set; }
    public int SessionsAttended { get; set; }
    public decimal ProratedAmount { get; set; }
    public bool IsOverage { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class EnrollStudentPackageDto
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    public int PackageDefinitionId { get; set; }

    [Required]
    [Range(2000, 2100)]
    public int BillingYear { get; set; }

    [Required]
    [Range(1, 12)]
    public int BillingMonth { get; set; }
}

public class BulkEnrollStudentPackageDto
{
    [Required]
    [MinLength(1)]
    public List<int> StudentIds { get; set; } = new();

    [Required]
    public int PackageDefinitionId { get; set; }

    [Required]
    [Range(2000, 2100)]
    public int BillingYear { get; set; }

    [Required]
    [Range(1, 12)]
    public int BillingMonth { get; set; }
}

// --- Payments ---

public class PaymentResponseDto
{
    public int Id { get; set; }
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public decimal Amount { get; set; }
    public decimal Discount { get; set; }
    public DateTime PaymentDate { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public string RecordedByName { get; set; } = string.Empty;
}

public class RecordPaymentDto
{
    [Required]
    public int StudentId { get; set; }

    [Required]
    [Range(0.01, 99999.99)]
    public decimal Amount { get; set; }

    [Range(0, 99999.99)]
    public decimal Discount { get; set; }

    [Required]
    public DateTime PaymentDate { get; set; }

    [StringLength(500)]
    public string? Notes { get; set; }
}

// --- Session Charges ---

public class SessionChargeDto
{
    public int SessionId { get; set; }
    public DateTime SessionDate { get; set; }
    public string ClassTypeName { get; set; } = string.Empty;
    public string ClassTypeColor { get; set; } = string.Empty;
    public decimal ChargeAmount { get; set; }
    public string ChargeSource { get; set; } = string.Empty; // e.g., "Package: 4-Session Pack" or "Default Rate"
    public string AttendanceStatus { get; set; } = string.Empty;
}

// --- Balance & Summary ---

public class StudentBalanceDto
{
    public int StudentId { get; set; }
    public string StudentName { get; set; } = string.Empty;
    public decimal TotalDues { get; set; }
    public decimal TotalPayments { get; set; }
    public decimal TotalDiscounts { get; set; }
    public decimal OutstandingBalance { get; set; }
    public decimal MonthlyDues { get; set; }
    public decimal MonthlyPayments { get; set; }
    public decimal MonthlyDiscounts { get; set; }
    public List<StudentPackageResponseDto> Packages { get; set; } = new();
    public List<SessionChargeDto> SessionCharges { get; set; } = new();
    public List<PaymentResponseDto> RecentPayments { get; set; } = new();
}

public class BillingSummaryDto
{
    public decimal TotalOutstanding { get; set; }
    public decimal BilledThisMonth { get; set; }
    public decimal CollectedThisMonth { get; set; }
    public int StudentsWithDues { get; set; }
    public List<StudentBalanceDto> StudentBalances { get; set; } = new();
}

public class ParentBillingSummaryDto
{
    public decimal TotalOutstanding { get; set; }
    public decimal TotalPaid { get; set; }
    public List<StudentBalanceDto> Children { get; set; } = new();
}
