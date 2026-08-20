namespace BuddyIO.SharedKernel.Abstractions;

/// <summary>
/// The current time, as a dependency.
/// </summary>
/// <remarks>
/// Nothing in the domain calls <c>DateTimeOffset.UtcNow</c> directly. Time is an
/// input, and code that reaches for the ambient clock cannot be tested for
/// expiry, retention or scheduling behaviour without waiting for real time to
/// pass.
///
/// Always UTC (assumption A-08). The API returns ISO 8601 and the client
/// formats to local; no server-side code ever deals in local time.
/// </remarks>
public interface IClock
{
    DateTimeOffset UtcNow { get; }
}

public sealed class SystemClock : IClock
{
    public DateTimeOffset UtcNow => DateTimeOffset.UtcNow;
}
