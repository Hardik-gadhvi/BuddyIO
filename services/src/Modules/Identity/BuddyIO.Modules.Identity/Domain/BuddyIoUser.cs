using Microsoft.AspNetCore.Identity;

namespace BuddyIO.Modules.Identity.Domain;

/// <summary>
/// A BuddyIO account.
/// </summary>
/// <remarks>
/// <para>
/// Extends <see cref="IdentityUser{TKey}"/> so password hashing, security
/// stamps, lockout and token generation come from the framework. The spec is
/// explicit that passwords are only ever hashed through an established
/// implementation, and this is it - there is no hand-written crypto anywhere in
/// this solution.
/// </para>
/// <para>
/// Mapping note: <c>UserName</c> holds the BuddyIO handle (assumption A-05,
/// lowercase, 3-30 chars) and <c>Email</c> holds the address. Identity's
/// normalised columns give us the case-insensitive uniqueness both need.
/// </para>
/// </remarks>
internal sealed class BuddyIoUser : IdentityUser<Guid>
{
    public required string DisplayName { get; set; }

    /// <summary>
    /// Stored as a date, never rendered on a profile.
    /// </summary>
    /// <remarks>
    /// Collected only to enforce the 13+ gate (open question Q-03). It is PII
    /// with no product use, so it is never projected into a response DTO.
    /// </remarks>
    public required DateOnly DateOfBirth { get; set; }

    /// <summary>
    /// Server-authoritative. The client asks where to go after sign-in; it does
    /// not decide.
    /// </summary>
    public bool HasCompletedOnboarding { get; set; }

    public required DateTimeOffset CreatedAt { get; set; }

    /// <summary>Set on deletion request; retained per the deletion workflow.</summary>
    public DateTimeOffset? DeletedAt { get; set; }
}
