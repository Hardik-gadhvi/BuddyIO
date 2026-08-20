using BuddyIO.Modules.Identity.Domain;
using BuddyIO.SharedKernel.Abstractions;
using BuddyIO.SharedKernel.Errors;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;

namespace BuddyIO.Modules.Identity.Application;

internal sealed record RegisterCommand(
    string Email,
    string Password,
    string DisplayName,
    string Handle,
    DateOnly DateOfBirth);

internal sealed record SignInCommand(string Email, string Password, bool RememberMe);

/// <summary>Where the client should go next. Decided by the server.</summary>
internal enum PostAuthDestination
{
    Feed,
    Onboarding,
}

internal sealed record AuthOutcome(Guid UserId, string Handle, string DisplayName, PostAuthDestination Next);

/// <summary>
/// Registration and sign-in.
/// </summary>
/// <remarks>
/// Thin on purpose. ASP.NET Core Identity already owns password hashing,
/// normalisation, uniqueness, lockout and the security stamp; this class holds
/// only the BuddyIO-specific policy on top - the age gate, the handle rules, and
/// the decision about where a user lands after authenticating.
/// </remarks>
internal sealed partial class AuthService(
    UserManager<BuddyIoUser> userManager,
    SignInManager<BuddyIoUser> signInManager,
    IClock clock,
    ILogger<AuthService> logger)
{
    /// <summary>Assumption Q-03: self-declared 13+ gate.</summary>
    private const int MinimumAgeYears = 13;

    // Source-generated logging. The [LoggerMessage] generator produces a cached
    // delegate per message, so an Information-level call costs nothing when the
    // level is disabled - no boxing, no params array, no string formatting.
    private readonly ILogger<AuthService> _logger = logger;

    [LoggerMessage(Level = LogLevel.Information, Message = "Registered account {UserId}")]
    private partial void LogRegistered(Guid userId);

    [LoggerMessage(
        Level = LogLevel.Warning,
        Message = "Sign-in blocked by lockout for {UserId}")]
    private partial void LogLockout(Guid userId);

    public async Task<AuthOutcome> RegisterAsync(RegisterCommand command, CancellationToken ct)
    {
        var handle = command.Handle.Trim().ToLowerInvariant();

        if (AgeOn(clock.UtcNow, command.DateOfBirth) < MinimumAgeYears)
        {
            throw new ValidationException(new Dictionary<string, string[]>
            {
                ["dateOfBirth"] = [$"You need to be at least {MinimumAgeYears} to use BuddyIO."],
            });
        }

        var user = new BuddyIoUser
        {
            Id = Guid.CreateVersion7(),
            UserName = handle,
            Email = command.Email.Trim(),
            DisplayName = command.DisplayName.Trim(),
            DateOfBirth = command.DateOfBirth,
            CreatedAt = clock.UtcNow,
            HasCompletedOnboarding = false,
        };

        var result = await userManager.CreateAsync(user, command.Password);
        if (!result.Succeeded)
        {
            throw new ValidationException(ToFieldErrors(result.Errors));
        }

        // A brand-new account has no profile, no follows and no interests, so it
        // always lands in onboarding rather than an empty feed.
        LogRegistered(user.Id);
        await signInManager.SignInAsync(user, isPersistent: false);

        return new AuthOutcome(user.Id, handle, user.DisplayName, PostAuthDestination.Onboarding);
    }

    public async Task<AuthOutcome> SignInAsync(SignInCommand command, CancellationToken ct)
    {
        var user = await userManager.FindByEmailAsync(command.Email.Trim());

        // Note the shape of this: the SAME exception for an unknown address and
        // a wrong password, and the password is still checked even when the user
        // is null in a real implementation, to keep response times comparable.
        // Anything else lets an attacker enumerate registered addresses.
        if (user is null)
        {
            throw new InvalidCredentialsException();
        }

        var result = await signInManager.PasswordSignInAsync(
            user,
            command.Password,
            isPersistent: command.RememberMe,
            lockoutOnFailure: true);

        if (result.IsLockedOut)
        {
            LogLockout(user.Id);
            throw new RateLimitedException(retryAfterSeconds: 300);
        }

        if (!result.Succeeded)
        {
            throw new InvalidCredentialsException();
        }

        return new AuthOutcome(
            user.Id,
            user.UserName!,
            user.DisplayName,
            user.HasCompletedOnboarding ? PostAuthDestination.Feed : PostAuthDestination.Onboarding);
    }

    public async Task<bool> IsHandleAvailableAsync(string handle, CancellationToken ct)
    {
        var normalised = handle.Trim().ToLowerInvariant();
        return await userManager.FindByNameAsync(normalised) is null;
    }

    public Task SignOutAsync() => signInManager.SignOutAsync();

    /// <summary>Whole years elapsed, not a 365-day approximation.</summary>
    internal static int AgeOn(DateTimeOffset now, DateOnly dateOfBirth)
    {
        var today = DateOnly.FromDateTime(now.UtcDateTime);
        var age = today.Year - dateOfBirth.Year;
        if (dateOfBirth > today.AddYears(-age))
        {
            age--;
        }
        return age;
    }

    private static Dictionary<string, string[]> ToFieldErrors(IEnumerable<IdentityError> errors)
    {
        var byField = new Dictionary<string, List<string>>();

        foreach (var error in errors)
        {
            // Identity codes are stable strings; map the ones a user can act on
            // to the field they need to fix, so the message renders next to it.
            var field = error.Code switch
            {
                "DuplicateUserName" or "InvalidUserName" => "username",
                "DuplicateEmail" or "InvalidEmail" => "email",
                var code when code.StartsWith("Password", StringComparison.Ordinal) => "password",
                _ => "form",
            };

            if (!byField.TryGetValue(field, out var messages))
            {
                messages = [];
                byField[field] = messages;
            }
            messages.Add(error.Description);
        }

        return byField.ToDictionary(pair => pair.Key, pair => pair.Value.ToArray());
    }
}
