using BuddyIO.Modules.Identity.Contracts;
using Microsoft.EntityFrameworkCore;

namespace BuddyIO.Modules.Identity.Infrastructure;

/// <summary>
/// Serves <see cref="IUserDirectory"/> to the other modules.
/// </summary>
/// <remarks>
/// The whole class is a projection boundary. Callers receive
/// <see cref="UserAccount"/> records built in the query, so no entity - and
/// therefore no email, password hash or lockout state - can escape the module
/// even by accident.
///
/// <c>AsNoTracking</c> is inherited from the context's default tracking
/// behaviour; these are reads and nothing here is ever saved.
/// </remarks>
internal sealed class UserDirectory(IdentityModuleDbContext dbContext) : IUserDirectory
{
    public async Task<UserAccount?> FindByIdAsync(Guid userId, CancellationToken cancellationToken = default)
        => await dbContext.Users
            .Where(user => user.Id == userId)
            .Select(user => new UserAccount(
                user.Id,
                user.UserName!,
                user.DisplayName,
                user.HasCompletedOnboarding,
                user.CreatedAt))
            .SingleOrDefaultAsync(cancellationToken);

    public async Task<UserAccount?> FindByHandleAsync(string handle, CancellationToken cancellationToken = default)
    {
        // Match on the normalised column, which is what the unique index covers.
        // Comparing UserName with ToLower() would produce a sequential scan.
        var normalised = handle.Trim().ToUpperInvariant();

        return await dbContext.Users
            .Where(user => user.NormalizedUserName == normalised)
            .Select(user => new UserAccount(
                user.Id,
                user.UserName!,
                user.DisplayName,
                user.HasCompletedOnboarding,
                user.CreatedAt))
            .SingleOrDefaultAsync(cancellationToken);
    }

    public Task<bool> ExistsAsync(Guid userId, CancellationToken cancellationToken = default)
        => dbContext.Users.AnyAsync(user => user.Id == userId, cancellationToken);
}
