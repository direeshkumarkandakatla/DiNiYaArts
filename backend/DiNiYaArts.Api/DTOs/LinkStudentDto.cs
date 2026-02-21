namespace DiNiYaArts.Api.DTOs;

public class LinkStudentDto
{
    public string? UserId { get; set; }
    public string? LinkType { get; set; } // "Self" or "Parent"
}
