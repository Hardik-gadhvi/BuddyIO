using BuddyIO.Modules.Identity.Application;
using BuddyIO.Modules.Identity.Contracts;
using BuddyIO.Modules.Identity.Domain;
using BuddyIO.Modules.Identity.Endpoints;
using BuddyIO.Modules.Identity.Infrastructure;
using BuddyIO.SharedKernel.Modules;
using FluentValidation;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace BuddyIO.Modules.Identity;

/// <summary>
/// The Identity module's entire public surface.
/// </summary>
/// <remarks>
/// <para>
/// Two methods, and that is the point. The API host composes modules by calling
/// <see cref="AddIdentityModule"/> and <see cref="MapIdentityEndpoints"/>; it
/// cannot see the DbContext, the entities, the service or the endpoint handlers,
/// because every one of them is <c>internal</c>.
/// </para>
/// <para>
/// That is compiler-enforced encapsulation rather than a naming convention, and
/// it is what makes extracting this module into its own service later a
/// mechanical job (ADR-0001).
/// </para>
/// </remarks>
public static class IdentityModule
{
    public static IServiceCollection AddIdentityModule(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        var connectionString = configuration.GetConnectionString("Postgres")
            ?? throw new InvalidOperationException(
                "Connection string 'Postgres' is not configured. See .env.example.");

        services.AddDbContext<IdentityModuleDbContext>(options =>
            options.UseNpgsql(connectionString, npgsql =>
                {
                    // Each module keeps its own migrations history table, inside
                    // its own schema, so modules can be migrated independently.
                    npgsql.MigrationsHistoryTable("__migrations", ModuleSchemas.Identity);
                    npgsql.EnableRetryOnFailure(maxRetryCount: 3);
                })
                // Reads are projected explicitly; nothing here needs the change
                // tracker, and leaving it on is a silent per-query cost.
                .UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking));

        services
            .AddIdentityCore<BuddyIoUser>(options =>
            {
                options.User.RequireUniqueEmail = true;
                // The handle charset (assumption A-05). Identity rejects
                // anything outside this before it reaches the database.
                options.User.AllowedUserNameCharacters = "abcdefghijklmnopqrstuvwxyz0123456789._";

                options.Password.RequiredLength = 8;
                // No character-class requirements, on purpose - see AuthValidators.
                options.Password.RequireDigit = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireNonAlphanumeric = false;

                options.Lockout.MaxFailedAccessAttempts = 10;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(5);

                options.SignIn.RequireConfirmedEmail = false; // Phase 3: email verification.
            })
            .AddRoles<IdentityRole<Guid>>()
            .AddEntityFrameworkStores<IdentityModuleDbContext>()
            .AddSignInManager()
            .AddDefaultTokenProviders();

        services.AddScoped<AuthService>();
        services.AddScoped<IUserDirectory, UserDirectory>();

        services.AddScoped<IValidator<RegisterRequest>, RegisterRequestValidator>();
        services.AddScoped<IValidator<SignInRequest>, SignInRequestValidator>();

        return services;
    }

    /// <summary>Maps this module onto an already-versioned route group.</summary>
    public static IEndpointRouteBuilder MapIdentityEndpoints(this IEndpointRouteBuilder builder)
        => builder.MapAuthEndpoints();
}
