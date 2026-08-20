using BuddyIO.Modules.Identity.Domain;
using BuddyIO.SharedKernel.Modules;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace BuddyIO.Modules.Identity.Infrastructure;

/// <summary>
/// The Identity module's slice of the database.
/// </summary>
/// <remarks>
/// <para>
/// Maps entirely into the <c>identity</c> schema (ADR-0001: one schema per
/// module, one database). A query that joins across schemas cannot be written
/// by accident from here - it would require adding another module's entity to
/// this context, which is a visible, reviewable act.
/// </para>
/// <para>
/// Internal, like everything else in the module. The API host composes it
/// through <c>IdentityModule.AddIdentityModule</c> and never touches the type.
/// </para>
/// </remarks>
internal sealed class IdentityModuleDbContext(DbContextOptions<IdentityModuleDbContext> options)
    : IdentityDbContext<BuddyIoUser, IdentityRole<Guid>, Guid>(options)
{
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.HasDefaultSchema(ModuleSchemas.Identity);

        builder.Entity<BuddyIoUser>(entity =>
        {
            entity.ToTable("users");

            entity.Property(user => user.DisplayName)
                .HasMaxLength(50)
                .IsRequired();

            entity.Property(user => user.DateOfBirth)
                .HasColumnType("date")
                .IsRequired();

            entity.Property(user => user.CreatedAt).IsRequired();

            // Handles are case-insensitively unique. Identity keeps the
            // normalised (upper-cased) copy in sync; the unique index goes on
            // THAT column, not on the display form, or "Maya" and "maya" would
            // both be registrable.
            entity.HasIndex(user => user.NormalizedUserName)
                .IsUnique()
                .HasDatabaseName("ix_users_normalized_username");

            entity.HasIndex(user => user.NormalizedEmail)
                .IsUnique()
                .HasDatabaseName("ix_users_normalized_email");

            // Soft-deleted accounts stay out of every query by default. This is
            // one of the few places soft deletion is genuinely correct: content
            // and messages authored by the account must survive its removal
            // until the purge saga completes.
            entity.HasQueryFilter(user => user.DeletedAt == null);
        });

        // Identity's own tables get snake_case names to match the rest of the
        // schema; the defaults are PascalCase, which reads badly in psql.
        builder.Entity<IdentityRole<Guid>>().ToTable("roles");
        builder.Entity<IdentityUserRole<Guid>>().ToTable("user_roles");
        builder.Entity<IdentityUserClaim<Guid>>().ToTable("user_claims");
        builder.Entity<IdentityUserLogin<Guid>>().ToTable("user_logins");
        builder.Entity<IdentityUserToken<Guid>>().ToTable("user_tokens");
        builder.Entity<IdentityRoleClaim<Guid>>().ToTable("role_claims");
    }
}
