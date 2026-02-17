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
        builder.Entity<ApplicationUser>()
            .HasOne(u => u.StudentProfile)
            .WithOne(s => s.User)
            .HasForeignKey<Student>(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // ApplicationUser -> ManagedStudents (one-to-many, for parents)
        builder.Entity<ApplicationUser>()
            .HasMany(u => u.ManagedStudents)
            .WithOne(s => s.Parent)
            .HasForeignKey(s => s.ParentUserId)
            .OnDelete(DeleteBehavior.SetNull);

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
            .OnDelete(DeleteBehavior.Cascade);

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

        // Indexes for better query performance
        builder.Entity<Session>()
            .HasIndex(s => s.StartDateTime);

        builder.Entity<Student>()
            .HasIndex(s => s.Email);

        builder.Entity<Attendance>()
            .HasIndex(a => new { a.SessionId, a.StudentId })
            .IsUnique(); // One attendance record per student per session

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
