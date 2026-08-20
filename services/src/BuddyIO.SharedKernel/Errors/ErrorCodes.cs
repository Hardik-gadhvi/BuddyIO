namespace BuddyIO.SharedKernel.Errors;

/// <summary>
/// Stable, machine-readable error codes.
/// </summary>
/// <remarks>
/// <para>
/// These are a published API contract, not log strings. They appear in the
/// Problem Details <c>type</c> and <c>code</c> of every failure response, and a
/// client is expected to branch on them. Renaming one is a breaking change.
/// </para>
/// <para>
/// The set mirrors <c>AppErrorCode</c> in
/// <c>apps/web/src/app/core/models/async-state.ts</c> exactly. The web client
/// declared these first, while building against mocks, and the API adopts them
/// rather than inventing a parallel vocabulary that someone would then have to
/// map between.
/// </para>
/// </remarks>
public static class ErrorCodes
{
    /// <summary>The request was well-formed but the values were not acceptable.</summary>
    public const string ValidationFailed = "validation_failed";

    /// <summary>The caller is authenticated but not allowed to do this.</summary>
    public const string Forbidden = "forbidden";

    /// <summary>The caller is not authenticated.</summary>
    public const string Unauthenticated = "unauthenticated";

    /// <summary>
    /// The resource does not exist, OR the caller may not know that it does.
    /// </summary>
    /// <remarks>
    /// Deliberately conflated. Returning 403 for a private post the caller
    /// cannot see confirms the post exists, which is exactly the leak that
    /// risk R-04 in the product brief warns about. Not-found is the safe answer.
    /// </remarks>
    public const string NotFound = "not_found";

    /// <summary>The caller has exceeded a rate limit.</summary>
    public const string RateLimited = "rate_limited";

    /// <summary>A concurrent modification was detected.</summary>
    public const string ConcurrencyConflict = "concurrency_conflict";

    /// <summary>The request conflicts with current state (e.g. a duplicate handle).</summary>
    public const string Conflict = "conflict";

    /// <summary>Something failed that the caller can reasonably retry.</summary>
    public const string RequestFailed = "request_failed";

    /// <summary>Anything unclassified. Should be rare, and always investigated.</summary>
    public const string Unknown = "unknown";
}
