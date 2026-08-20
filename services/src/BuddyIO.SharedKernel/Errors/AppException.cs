namespace BuddyIO.SharedKernel.Errors;

/// <summary>
/// A failure the caller is allowed to know about.
/// </summary>
/// <remarks>
/// The distinction that matters: anything deriving from this is a KNOWN,
/// expected outcome, and its <see cref="Exception.Message"/> is safe to send to
/// a client. Every other exception is a bug or an infrastructure fault, and the
/// exception middleware replaces its message with a generic one so internals
/// never leak into a response.
/// </remarks>
public abstract class AppException : Exception
{
    private static readonly IReadOnlyDictionary<string, string[]> NoErrors =
        new Dictionary<string, string[]>();

    protected AppException(
        string code,
        int statusCode,
        string message,
        IReadOnlyDictionary<string, string[]>? errors = null)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Errors = errors ?? NoErrors;
    }

    /// <summary>A value from <see cref="ErrorCodes"/>.</summary>
    public string Code { get; }

    public int StatusCode { get; }

    /// <summary>Per-field errors. Empty for everything except validation.</summary>
    public IReadOnlyDictionary<string, string[]> Errors { get; }
}

public sealed class ValidationException(IReadOnlyDictionary<string, string[]> errors)
    : AppException(
        ErrorCodes.ValidationFailed,
        HttpStatus.BadRequest,
        "One or more values need attention.",
        errors);

public sealed class NotFoundException(string what)
    : AppException(ErrorCodes.NotFound, HttpStatus.NotFound, $"{what} was not found.");

public sealed class ForbiddenException(string message = "You do not have access to that.")
    : AppException(ErrorCodes.Forbidden, HttpStatus.Forbidden, message);

public sealed class UnauthenticatedException(string message = "You need to sign in to do that.")
    : AppException(ErrorCodes.Unauthenticated, HttpStatus.Unauthorized, message);

public sealed class ConflictException(string message)
    : AppException(ErrorCodes.Conflict, HttpStatus.Conflict, message);

public sealed class RateLimitedException(int retryAfterSeconds)
    : AppException(
        ErrorCodes.RateLimited,
        HttpStatus.TooManyRequests,
        "You are doing that too quickly. Please wait a moment and try again.")
{
    public int RetryAfterSeconds { get; } = retryAfterSeconds;
}

/// <summary>
/// Sign-in failure. One message for a wrong address AND a wrong password.
/// </summary>
/// <remarks>
/// Distinguishing them turns the endpoint into an account-enumeration oracle:
/// anyone could test an email list against it. The web client's sign-in screen
/// makes the same choice, and the two must not disagree.
///
/// Note the 401 status with a <c>forbidden</c> code: the status says "you are
/// not authenticated", the code is what the client branches on.
/// </remarks>
public sealed class InvalidCredentialsException()
    : AppException(
        ErrorCodes.Forbidden,
        HttpStatus.Unauthorized,
        "That email or password is not right. Please try again.");

/// <summary>
/// The HTTP status codes used by the exceptions above.
/// </summary>
/// <remarks>
/// The shared kernel has no framework references by design, so it cannot see
/// <c>Microsoft.AspNetCore.Http.StatusCodes</c>. Restating six integers is a
/// better trade than pulling the web stack into every module that references
/// the kernel.
/// </remarks>
internal static class HttpStatus
{
    internal const int BadRequest = 400;
    internal const int Unauthorized = 401;
    internal const int Forbidden = 403;
    internal const int NotFound = 404;
    internal const int Conflict = 409;
    internal const int TooManyRequests = 429;
}
