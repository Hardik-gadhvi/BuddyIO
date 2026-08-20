namespace BuddyIO.Modules.Identity.Contracts;

/// <summary>
/// The only thing other modules may ask the Identity module.
/// </summary>
/// <remarks>
/// <para>
/// Profiles, Content and Messaging all need to know that a user id is real and
/// resolve a handle. None of them may reach for Identity's DbContext or its
/// entities to do it - that is the boundary ADR-0001 exists to protect, and
/// BuddyIO.ArchitectureTests fails the build if it is crossed.
/// </para>
/// <para>
/// Deliberately read-only and deliberately small. Anything that MUTATES another
/// module's state belongs on an integration event, not on a synchronous
/// interface, so that extracting Identity into its own service later is a
/// transport swap rather than a redesign.
/// </para>
/// </remarks>
public interface IUserDirectory
{
    Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken cancellationToken = default);

    Task<UserAccount?> FindByHandleAsync(string handle, CancellationToken cancellationToken = default);

    Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken = default);
}

/// <summary>
/// The account facts other modules are allowed to see.
/// </summary>
/// <remarks>
/// Note what is NOT here: email, password hash, date of birth, security stamps,
/// lockout state. Those are Identity's business. A DTO that exposes everything
/// is a boundary in name only.
/// </remarks>
public sealed record UserAccount(
    Guid Id,
    string Handle,
    string DisplayName,
    bool HasCompletedOnboarding,
    DateTimeOffset CreatedAt);
