namespace DiNiYaArts.Api.DTOs;

public class StudentResponseDto
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string? Email { get; set; }
    public string? Phone { get; set; }
    public DateTime? DateOfBirth { get; set; }
    public string? AgeGroup { get; set; }
    public bool IsActive { get; set; }
    public int TotalAttendances { get; set; }
    public string? UserId { get; set; }
    public string? LinkedUserName { get; set; }
    public string? ParentUserId { get; set; }
    public string? ParentName { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<EnrolledPackageDto> EnrolledPackages { get; set; } = new();
}

public class EnrolledPackageDto
{
    public int Id { get; set; }
    public string PackageName { get; set; } = string.Empty;
    public string ClassTypeName { get; set; } = string.Empty;
    public string BillingPeriod { get; set; } = string.Empty;
}
