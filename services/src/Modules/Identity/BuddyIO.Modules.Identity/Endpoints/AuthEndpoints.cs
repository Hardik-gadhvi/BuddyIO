using System.Security.Claims;
using BuddyIO.Modules.Identity.Application;
using BuddyIO.Modules.Identity.Contracts;
using BuddyIO.SharedKernel.Errors;
using FluentValidation;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Routing;

// FluentValidation ships its own ValidationException. Ours is the one that
// carries an ErrorCode and maps to Problem Details, so it wins the short name.
using ValidationException = BuddyIO.SharedKernel.Errors.ValidationException;

namespace BuddyIO.Modules.Identity.Endpoints;

// ---------------------------------------------------------------- contracts --

/// <remarks>
/// These mirror the shapes the Angular client already declares in
/// <c>features/auth/data-access/auth.repository.ts</c>. The client was written
/// against mocks first, so the contract is adopted here rather than invented
/// and then mapped.
/// </remarks>
public sealed record RegisterRequest(
    string Email,
    string Password,
    string DisplayName,
    string Username,
    DateOnly DateOfBirth);

public sealed record SignInRequest(string Email, string Password, bool RememberMe);

/// <summary>
/// Note the absence of a token.
/// </summary>
/// <remarks>
/// Authentication is carried by an httpOnly session cookie the browser holds and
/// JavaScript cannot read. Putting a token in this body would immediately
/// recreate the localStorage problem the architecture exists to avoid.
/// </remarks>
public sealed record AuthResponse(AuthUserResponse User, string Next);

public sealed record AuthUserResponse(
    Guid Id,
    string Username,
    string DisplayName,
    bool HasCompletedOnboarding);

public sealed record UsernameAvailabilityResponse(string Username, bool Available);

// ---------------------------------------------------------------- endpoints --

internal static class AuthEndpoints
{
    internal static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder builder)
    {
        var group = builder.MapGroup("/auth").WithTags("Authentication");

        group.MapPost("/register", RegisterAsync)
            .WithName("Register")
            .WithSummary("Create an account and start a session.")
            .AllowAnonymous();

        group.MapPost("/login", SignInAsync)
            .WithName("SignIn")
            .WithSummary("Start a session.")
            .AllowAnonymous();

        group.MapPost("/logout", SignOutAsync)
            .WithName("SignOut")
            .WithSummary("End the current session.")
            .RequireAuthorization();

        group.MapGet("/me", GetCurrentUserAsync)
            .WithName("GetCurrentUser")
            .WithSummary("The signed-in account.")
            .RequireAuthorization();

        group.MapGet("/username-available", CheckUsernameAsync)
            .WithName("CheckUsernameAvailability")
            .WithSummary("Whether a handle can be claimed.")
            .AllowAnonymous();

        return builder;
    }

    private static async Task<Ok<AuthResponse>> RegisterAsync(
        RegisterRequest request,
        AuthService auth,
        IValidator<RegisterRequest> validator,
        CancellationToken ct)
    {
        await validator.EnsureValidAsync(request, ct);

        var outcome = await auth.RegisterAsync(
            new RegisterCommand(
                request.Email,
                request.Password,
                request.DisplayName,
                request.Username,
                request.DateOfBirth),
            ct);

        return TypedResults.Ok(ToResponse(outcome));
    }

    private static async Task<Ok<AuthResponse>> SignInAsync(
        SignInRequest request,
        AuthService auth,
        IValidator<SignInRequest> validator,
        CancellationToken ct)
    {
        await validator.EnsureValidAsync(request, ct);

        var outcome = await auth.SignInAsync(
            new SignInCommand(request.Email, request.Password, request.RememberMe),
            ct);

        return TypedResults.Ok(ToResponse(outcome));
    }

    private static async Task<NoContent> SignOutAsync(AuthService auth)
    {
        await auth.SignOutAsync();
        return TypedResults.NoContent();
    }

    private static async Task<Ok<AuthUserResponse>> GetCurrentUserAsync(
        ClaimsPrincipal principal,
        IUserDirectory users,
        CancellationToken ct)
    {
        var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (!Guid.TryParse(id, out var userId))
        {
            // The cookie authenticated but carries claims we cannot read, which
            // means it is stale or malformed rather than merely absent.
            throw new UnauthenticatedException();
        }

        // Read the account rather than reconstructing it from claims. Claims are
        // a snapshot taken at sign-in: a display name or onboarding flag changed
        // since then would be stale here, and `hasCompletedOnboarding` decides
        // where the client routes on every load.
        var account = await users.FindByIdAsync(userId, ct)
            ?? throw new UnauthenticatedException("That session is no longer valid.");

        return TypedResults.Ok(new AuthUserResponse(
            account.Id,
            account.Handle,
            account.DisplayName,
            account.HasCompletedOnboarding));
    }

    private static async Task<Ok<UsernameAvailabilityResponse>> CheckUsernameAsync(
        string username,
        AuthService auth,
        CancellationToken ct)
    {
        var available = await auth.IsHandleAvailableAsync(username, ct);
        return TypedResults.Ok(new UsernameAvailabilityResponse(username, available));
    }

    private static AuthResponse ToResponse(AuthOutcome outcome) =>
        new(
            new AuthUserResponse(
                outcome.UserId,
                outcome.Handle,
                outcome.DisplayName,
                outcome.Next == PostAuthDestination.Feed),
            outcome.Next == PostAuthDestination.Feed ? "feed" : "onboarding");
}

/// <summary>
/// Turns a FluentValidation failure into the solution's validation exception.
/// </summary>
/// <remarks>
/// Kept as an extension rather than an endpoint filter so validation is visible
/// at the top of each handler. An invisible filter is easy to forget to
/// register, and a missing validation step fails silently open.
/// </remarks>
internal static class ValidatorExtensions
{
    internal static async Task EnsureValidAsync<T>(
        this IValidator<T> validator,
        T instance,
        CancellationToken ct)
    {
        var result = await validator.ValidateAsync(instance, ct);
        if (result.IsValid)
        {
            return;
        }

        var errors = result.Errors
            .GroupBy(failure => Camelise(failure.PropertyName))
            .ToDictionary(
                group => group.Key,
                group => group.Select(failure => failure.ErrorMessage).ToArray());

        throw new ValidationException(errors);
    }

    /// <summary>Property names go out camelCased, matching the JSON contract.</summary>
    private static string Camelise(string name) =>
        string.IsNullOrEmpty(name) ? name : char.ToLowerInvariant(name[0]) + name[1..];
}
