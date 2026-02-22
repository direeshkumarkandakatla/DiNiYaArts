using DiNiYaArts.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace DiNiYaArts.Api.Data;

public class ApplicationDbContext : IdentityDbContext<ApplicationUser>
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // DbSets for our models
    public DbSet<ClassType> ClassTypes { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<Student> Students { get; set; }
    public DbSet<Attendance> Attendances { get; set; }
    public DbSet<StudentLinkRequest> StudentLinkRequests { get; set; }
    public DbSet<PackageDefinition> PackageDefinitions { get; set; }
    public DbSet<StudentPackage> StudentPackages { get; set; }
    public DbSet<Payment> Payments { get; set; }

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configure relationships

        // ApplicationUser -> Sessions (one-to-many)
        builder.Entity<ApplicationUser>()
            .HasMany(u => u.CreatedSessions)
            .WithOne(s => s.CreatedBy)
            .HasForeignKey(s => s.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ApplicationUser -> StudentProfile (one-to-one)
        // Restrict: can't delete a user who has a student profile (SQL Server cascade path safety)
        builder.Entity<ApplicationUser>()
            .HasOne(u => u.StudentProfile)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ApplicationUser -> ManagedStudents (one-to-many, for parents)
        // Restrict: can't delete a user who manages students (SQL Server cascade path safety)
        builder.Entity<ApplicationUser>()
            .HasMany(u => u.ManagedStudents)
            .WithOne(s => s.Parent)
            .HasForeignKey(s => s.ParentUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // ClassType decimal config
        builder.Entity<ClassType>()
            .Property(ct => ct.DefaultSessionPrice)
            .HasColumnType("decimal(10,2)");

        // ClassType -> Sessions (one-to-many)
        builder.Entity<ClassType>()
            .HasMany(ct => ct.Sessions)
            .WithOne(s => s.ClassType)
            .HasForeignKey(s => s.ClassTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        // Session -> Attendances (one-to-many)
        builder.Entity<Session>()
            .HasMany(s => s.Attendances)
            .WithOne(a => a.Session)
            .HasForeignKey(a => a.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Student -> Attendances (one-to-many)
        builder.Entity<Student>()
            .HasMany(s => s.Attendances)
            .WithOne(a => a.Student)
            .HasForeignKey(a => a.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // StudentLinkRequest -> RequestedBy (many-to-one)
        builder.Entity<StudentLinkRequest>()
            .HasOne(r => r.RequestedBy)
            .WithMany()
            .HasForeignKey(r => r.RequestedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // StudentLinkRequest -> Student (many-to-one, optional)
        builder.Entity<StudentLinkRequest>()
            .HasOne(r => r.Student)
            .WithMany()
            .HasForeignKey(r => r.StudentId)
            .OnDelete(DeleteBehavior.SetNull);

        // StudentLinkRequest -> ReviewedBy (many-to-one, optional)
        builder.Entity<StudentLinkRequest>()
            .HasOne(r => r.ReviewedBy)
            .WithMany()
            .HasForeignKey(r => r.ReviewedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        // PackageDefinition -> ClassType (many-to-one)
        builder.Entity<PackageDefinition>()
            .HasOne(p => p.ClassType)
            .WithMany()
            .HasForeignKey(p => p.ClassTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<PackageDefinition>()
            .Property(p => p.Price)
            .HasColumnType("decimal(10,2)");

        // Student -> StudentPackages (one-to-many)
        builder.Entity<Student>()
            .HasMany(s => s.Packages)
            .WithOne(sp => sp.Student)
            .HasForeignKey(sp => sp.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // StudentPackage -> PackageDefinition (many-to-one)
        builder.Entity<StudentPackage>()
            .HasOne(sp => sp.PackageDefinition)
            .WithMany()
            .HasForeignKey(sp => sp.PackageDefinitionId)
            .OnDelete(DeleteBehavior.Restrict);

        // StudentPackage -> CreatedBy (many-to-one)
        builder.Entity<StudentPackage>()
            .HasOne(sp => sp.CreatedBy)
            .WithMany()
            .HasForeignKey(sp => sp.CreatedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<StudentPackage>()
            .Property(sp => sp.PackagePrice)
            .HasColumnType("decimal(10,2)");

        builder.Entity<StudentPackage>()
            .HasIndex(sp => new { sp.StudentId, sp.PackageDefinitionId, sp.BillingYear, sp.BillingMonth })
            .IsUnique();

        // Student -> Payments (one-to-many)
        builder.Entity<Student>()
            .HasMany(s => s.Payments)
            .WithOne(p => p.Student)
            .HasForeignKey(p => p.StudentId)
            .OnDelete(DeleteBehavior.Cascade);

        // Payment -> RecordedBy (many-to-one)
        builder.Entity<Payment>()
            .HasOne(p => p.RecordedBy)
            .WithMany()
            .HasForeignKey(p => p.RecordedByUserId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasColumnType("decimal(10,2)");

        builder.Entity<Payment>()
            .Property(p => p.Discount)
            .HasColumnType("decimal(10,2)");

        // Indexes for better query performance
        builder.Entity<Session>()
            .HasIndex(s => s.StartDateTime);

        builder.Entity<Student>()
            .HasIndex(s => s.Email);

        builder.Entity<Attendance>()
            .HasIndex(a => new { a.SessionId, a.StudentId })
            .IsUnique(); // One attendance record per student per session

        // SQL Server does not support multiple cascade paths.
        // Set all foreign keys to Restrict (NO ACTION) to prevent cascade conflicts.
        foreach (var foreignKey in builder.Model.GetEntityTypes()
            .SelectMany(e => e.GetForeignKeys()))
        {
            foreignKey.DeleteBehavior = DeleteBehavior.Restrict;
        }

        // Seed initial roles
        SeedRoles(builder);

        // Seed initial class types
        SeedClassTypes(builder);
    }

    private void SeedRoles(ModelBuilder builder)
    {
        var roles = new[]
        {
            new IdentityRole
            {
                Id = "1",
                Name = "Administrator",
                NormalizedName = "ADMINISTRATOR",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole
            {
                Id = "2",
                Name = "Instructor",
                NormalizedName = "INSTRUCTOR",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole
            {
                Id = "3",
                Name = "Student",
                NormalizedName = "STUDENT",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            },
            new IdentityRole
            {
                Id = "4",
                Name = "Parent",
                NormalizedName = "PARENT",
                ConcurrencyStamp = Guid.NewGuid().ToString()
            }
        };

        builder.Entity<IdentityRole>().HasData(roles);
    }

    private void SeedClassTypes(ModelBuilder builder)
    {
        var classTypes = new[]
        {
            new ClassType
            {
                Id = 1,
                Name = "Painting",
                Color = "#FF6B6B",
                Description = "Creative painting classes for all skill levels",
                TargetAgeGroup = AgeGroup.AllAges,
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            }
        };

        builder.Entity<ClassType>().HasData(classTypes);
    }
}
