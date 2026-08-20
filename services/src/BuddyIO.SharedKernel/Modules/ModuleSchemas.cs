namespace BuddyIO.SharedKernel.Modules;

/// <summary>
/// One PostgreSQL schema per module, in one database.
/// </summary>
/// <remarks>
/// This is how ADR-0001's "each module owns its schema" is made concrete. A
/// module's DbContext maps only into its own schema, so a cross-module join is
/// not something you can write by accident - it has to be a deliberate,
/// visible act, which is exactly when someone should be asking whether a
/// published contract or an integration event belongs there instead.
/// </remarks>
public static class ModuleSchemas
{
    public const string Identity = "identity";
    public const string Profiles = "profiles";
    public const string Content = "content";
    public const string Engagement = "engagement";
    public const string Feed = "feed";
    public const string Messaging = "messaging";
    public const string Notifications = "notifications";
    public const string Moderation = "moderation";
    public const string Media = "media";
}
