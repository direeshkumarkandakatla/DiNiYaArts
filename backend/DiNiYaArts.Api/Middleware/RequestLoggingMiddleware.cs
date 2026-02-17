using System.Diagnostics;

namespace DiNiYaArts.Api.Middleware;

public class RequestLoggingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestLoggingMiddleware> _logger;

    public RequestLoggingMiddleware(RequestDelegate next, ILogger<RequestLoggingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid().ToString("N")[..8]; // Short unique ID
        var method = context.Request.Method;
        var path = context.Request.Path;
        var queryString = context.Request.QueryString;
        var startTime = DateTime.UtcNow;
        var stopwatch = Stopwatch.StartNew();

        _logger.LogInformation(
            "[{RequestId}] Request STARTED: {Method} {Path}{QueryString} at {StartTime:yyyy-MM-dd HH:mm:ss.fff}",
            requestId, method, path, queryString, startTime);

        try
        {
            await _next(context);

            stopwatch.Stop();
            var statusCode = context.Response.StatusCode;
            var endTime = DateTime.UtcNow;

            _logger.LogInformation(
                "[{RequestId}] Request COMPLETED: {Method} {Path} - Status: {StatusCode} - Duration: {Duration}ms - EndTime: {EndTime:yyyy-MM-dd HH:mm:ss.fff}",
                requestId, method, path, statusCode, stopwatch.ElapsedMilliseconds, endTime);
        }
        catch (Exception ex)
        {
            stopwatch.Stop();
            var endTime = DateTime.UtcNow;

            _logger.LogError(ex,
                "[{RequestId}] Request FAILED: {Method} {Path} - Duration: {Duration}ms - EndTime: {EndTime:yyyy-MM-dd HH:mm:ss.fff} - Error: {ErrorMessage}",
                requestId, method, path, stopwatch.ElapsedMilliseconds, endTime, ex.Message);

            throw; // Re-throw to let the exception handler deal with it
        }
    }
}
