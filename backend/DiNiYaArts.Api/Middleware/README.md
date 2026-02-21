# Middleware — Custom Request Pipeline

This folder contains two custom middleware components that wrap every HTTP request for logging and error handling. They are registered in `Program.cs` as the outermost layers of the pipeline.

## Pipeline Order

```
1. ExceptionHandlingMiddleware   ← Outermost: catches all unhandled exceptions
2. RequestLoggingMiddleware      ← Logs request timing and details
3. Serilog Request Logging       ← Built-in structured HTTP logging
4. CORS → Auth → Authorization → Controller
```

The order matters: exception handling must be outermost to catch errors from any layer below it.

---

## ExceptionHandlingMiddleware.cs

**Purpose:** Global exception handler that catches any unhandled exception, logs it, and returns a clean JSON error response instead of a stack trace.

**How it works:**
1. Wraps `await _next(context)` in a try-catch
2. On exception:
   - Logs full exception details (type, message, stack trace, inner exception chain)
   - Sets response status to 500
   - Returns JSON: `{ "message": "An unexpected error occurred", "detail": "..." }`
3. In development: includes the exception message in `detail`
4. In production: returns generic error message (no sensitive info leak)

**Log output example:**
```
[ERR] Unhandled exception
  Exception Type: System.InvalidOperationException
  Message: Sequence contains no elements
  Stack Trace: at System.Linq.ThrowHelper...
```

**Response format:**
```json
{
  "message": "An unexpected error occurred",
  "detail": "Sequence contains no elements"
}
```

---

## RequestLoggingMiddleware.cs

**Purpose:** Logs every HTTP request with timing information and a unique request ID for tracing.

**How it works:**
1. Generates an 8-character unique request ID (from GUID)
2. Logs request start: method, path, query string
3. Starts a `Stopwatch`
4. Calls `await _next(context)`
5. Logs request completion: status code, duration in milliseconds
6. If an exception occurs: logs failure with error message, then re-throws

**Log output example:**
```
[INF] [a1b2c3d4] → POST /api/auth/login ?
[INF] [a1b2c3d4] ← 200 in 45ms
```

Or on failure:
```
[INF] [e5f6g7h8] → GET /api/billing/summary ?year=2026&month=2
[ERR] [e5f6g7h8] ✗ FAILED after 12ms - SQLite cannot apply aggregate...
```

**Why both this AND Serilog request logging?**
- `RequestLoggingMiddleware` provides the unique request ID and custom formatting
- `UseSerilogRequestLogging()` adds Serilog's structured request log (method, path, status, elapsed) which integrates with Serilog sinks and can be queried in log analysis tools

They complement each other — the custom middleware gives human-readable tracing, while Serilog gives structured/queryable data.
