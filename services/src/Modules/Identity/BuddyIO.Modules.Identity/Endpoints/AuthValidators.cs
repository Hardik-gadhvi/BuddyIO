using System.Text.RegularExpressions;
using FluentValidation;

namespace BuddyIO.Modules.Identity.Endpoints;

/// <summary>
/// Request-boundary validation.
/// </summary>
/// <remarks>
/// These duplicate the client-side rules in
/// <c>apps/web/src/app/shared/forms/validators.ts</c>, and that duplication is
/// correct: the client's copy exists to give fast feedback, this copy exists
/// because a client cannot be trusted. If they ever disagree, this one wins.
/// </remarks>
internal sealed partial class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(request => request.Email)
            .NotEmpty().WithMessage("Enter your email address.")
            .EmailAddress().WithMessage("Enter a valid email address.")
            .MaximumLength(256);

        RuleFor(request => request.Password)
            .NotEmpty().WithMessage("Choose a password.")
            // Length is the control that matters (NIST SP 800-63B). No
            // character-class checklist: those push people to `Password1!`.
            .MinimumLength(8).WithMessage("Use at least 8 characters.")
            .MaximumLength(256).WithMessage("That password is too long.");

        RuleFor(request => request.DisplayName)
            .NotEmpty().WithMessage("Enter a display name.")
            .MaximumLength(50).WithMessage("Use 50 characters or fewer.");

        RuleFor(request => request.Username)
            .NotEmpty().WithMessage("Choose a username.")
            .Must(handle => HandlePattern().IsMatch(handle))
            .WithMessage("Use 3 to 30 lowercase letters, numbers, dots or underscores.");

        RuleFor(request => request.DateOfBirth)
            .NotEqual(default(DateOnly)).WithMessage("Enter your date of birth.")
            .Must(date => date <= DateOnly.FromDateTime(DateTime.UtcNow))
            .WithMessage("That date is in the future.");
    }

    /// <summary>Assumption A-05.</summary>
    [GeneratedRegex("^[a-z0-9._]{3,30}$", RegexOptions.CultureInvariant)]
    private static partial Regex HandlePattern();
}

internal sealed class SignInRequestValidator : AbstractValidator<SignInRequest>
{
    public SignInRequestValidator()
    {
        // Only presence is checked. Applying format or length rules to a
        // sign-in password tells an attacker what the password policy is, and
        // rejects users whose password predates a policy change.
        RuleFor(request => request.Email).NotEmpty().WithMessage("Enter your email address.");
        RuleFor(request => request.Password).NotEmpty().WithMessage("Enter your password.");
    }
}
