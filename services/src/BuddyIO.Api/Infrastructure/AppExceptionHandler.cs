using System.Diagnostics;
using BuddyIO.SharedKernel.Errors;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;

namespace BuddyIO.Api.Infrastructure;

/// <summary>
/// Turns every unhandled exception into RFC 9457 Problem Details.
/// </summary>
/// <remarks>
/// <para>
/// The rule this enforces: a client sees a real, actionable message only for a
/// <see cref="AppException"/>, which is a failure we anticipated. Everything
/// else gets a generic message, because an unanticipated exception's text
/// routinely contains connection strings, file paths, SQL and stack frames.
/// </para>
/// <para>
/// Every response carries the trace id in <c>correlationId</c>. That is the same
/// value the web client renders in its error state, so a screenshot from a user
/// is enough to find the exact request in the traces.
/// </para>
/// </remarks>
internal sealed partial class AppExceptionHandler(
    IProblemDetailsService problemDetailsService,
    ILogger<AppExceptionHandler> logger) : IExceptionHandler
{
    /// <summary>Problem Details `type` URIs are namespaced to the product.</summary>
    private const string TypeBase = "https://buddyio.dev/errors/";

    private readonly ILogger<AppExceptionHandler> _logger = logger;

    [LoggerMessage(
        Level = LogLevel.Error,
        Message = "Unhandled exception on {Method} {Path} ({CorrelationId})")]
    private partial void LogUnhandled(
        Exception exception, string method, string path, string correlationId);

    [LoggerMessage(
        Level = LogLevel.Information,
        Message = "Request failed with {Code} on {Method} {Path} ({CorrelationId})")]
    private partial void LogExpectedFailure(
        string code, string method, string path, string correlationId);

    public async ValueTask<bool> TryHandleAsync(
        HttpContext httpContext,
        Exception exception,
        CancellationToken cancellationToken)
    {
        var correlationId = Activity.Current?.TraceId.ToString()
            ?? httpContext.TraceIdentifier;

        var (statusCode, code, title, detail, errors) = Describe(exception);

        // Materialised once: PathString -> string is an implicit conversion, and
        // doing it inside the logging call makes it run even when the level is
        // disabled (CA1873).
        var method = httpContext.Request.Method;
        var path = httpContext.Request.Path.ToString();

        if (statusCode >= StatusCodes.Status500InternalServerError)
        {
            LogUnhandled(exception, method, path, correlationId);
        }
        else
        {
            // Expected failures are information, not errors. Logging a wrong
            // password at Error level makes the error log useless.
            LogExpectedFailure(code, method, path, correlationId);
        }

        if (exception is RateLimitedException rateLimited)
        {
            httpContext.Response.Headers.RetryAfter = rateLimited.RetryAfterSeconds.ToString();
        }

        httpContext.Response.StatusCode = statusCode;

        var problemDetails = new ProblemDetails
        {
            Status = statusCode,
            Title = title,
            Detail = detail,
            Type = TypeBase + code,
            Instance = $"{method} {path}",
        };

        // `code` is duplicated out of `type` on purpose: clients branch on a
        // stable string, and parsing it back out of a URI is needless work.
        problemDetails.Extensions["code"] = code;
        problemDetails.Extensions["correlationId"] = correlationId;

        if (errors.Count > 0)
        {
            problemDetails.Extensions["errors"] = errors;
        }

        return await problemDetailsService.TryWriteAsync(new ProblemDetailsContext
        {
            HttpContext = httpContext,
            Exception = exception,
            ProblemDetails = problemDetails,
        });
    }

    private static (
        int StatusCode,
        string Code,
        string Title,
        string Detail,
        IReadOnlyDictionary<string, string[]> Errors) Describe(Exception exception)
        => exception switch
        {
            AppException app => (
                app.StatusCode,
                app.Code,
                TitleFor(app.StatusCode),
                app.Message,
                app.Errors),

            // A cancelled request is the client hanging up, not a fault. 499 is
            // nginx's convention and keeps these out of the 5xx error budget.
            OperationCanceledException => (
                499,
                ErrorCodes.RequestFailed,
                "Request cancelled",
                "The request was cancelled.",
                EmptyErrors),

            _ => (
                StatusCodes.Status500InternalServerError,
                ErrorCodes.Unknown,
                "Something went wrong",
                // Deliberately says nothing. The detail is in the logs, findable
                // by correlation id.
                "Something went wrong on our side. Please try again.",
                EmptyErrors),
        };

    private static readonly IReadOnlyDictionary<string, string[]> EmptyErrors =
        new Dictionary<string, string[]>();

    private static string TitleFor(int statusCode) => statusCode switch
    {
        StatusCodes.Status400BadRequest => "Check these values",
        StatusCodes.Status401Unauthorized => "Sign in required",
        StatusCodes.Status403Forbidden => "Not allowed",
        StatusCodes.Status404NotFound => "Not found",
        StatusCodes.Status409Conflict => "Conflict",
        StatusCodes.Status429TooManyRequests => "Too many requests",
        _ => "Request failed",
    };
}
