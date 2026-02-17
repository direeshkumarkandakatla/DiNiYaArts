using System.Net;
using System.Text.Json;

namespace DiNiYaArts.Api.Middleware;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex,
                "Unhandled exception occurred while processing {Method} {Path}. Exception: {ExceptionType} - Message: {Message} - StackTrace: {StackTrace}",
                context.Request.Method,
                context.Request.Path,
                ex.GetType().Name,
                ex.Message,
                ex.StackTrace);

            // Log inner exceptions
            var innerEx = ex.InnerException;
            var depth = 1;
            while (innerEx != null)
            {
                _logger.LogError(
                    "Inner Exception [{Depth}]: {ExceptionType} - Message: {Message}",
                    depth, innerEx.GetType().Name, innerEx.Message);
                innerEx = innerEx.InnerException;
                depth++;
            }

            await HandleExceptionAsync(context, ex);
        }
    }

    private static async Task HandleExceptionAsync(HttpContext context, Exception exception)
    {
        context.Response.ContentType = "application/json";
        context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

        var response = new
        {
            statusCode = context.Response.StatusCode,
            message = "An unexpected error occurred. Please try again later.",
            // Only include details in development
            detail = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development"
                ? exception.Message
                : null
        };

        var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
        await context.Response.WriteAsync(JsonSerializer.Serialize(response, options));
    }
}
