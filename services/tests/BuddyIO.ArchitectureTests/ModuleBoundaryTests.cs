using System.Reflection;
using NetArchTest.Rules;
using Shouldly;

// xunit also defines a TestResult. NetArchTest's is the one this file reasons
// about, so it takes the short name.
using TestResult = NetArchTest.Rules.TestResult;

namespace BuddyIO.ArchitectureTests;

/// <summary>
/// Executable module boundaries.
/// </summary>
/// <remarks>
/// <para>
/// ADR-0001 chose a modular monolith over microservices, and the entire
/// justification for that choice is that the boundaries are real. A boundary
/// that lives only in a document erodes within a few sprints - someone needs one
/// field from another module's table, adds a reference, and nobody notices in
/// review.
/// </para>
/// <para>
/// These tests are that review. They are written to cover modules generically,
/// so a module added later is policed automatically rather than needing someone
/// to remember to extend this file.
/// </para>
/// </remarks>
public sealed class ModuleBoundaryTests
{
    private const string ModuleNamespacePrefix = "BuddyIO.Modules.";
    private const string ContractsSuffix = ".Contracts";

    private static readonly Assembly[] ModuleAssemblies =
    [
        typeof(Modules.Identity.IdentityModule).Assembly,
    ];

    private static readonly Assembly SharedKernel =
        typeof(SharedKernel.Abstractions.IClock).Assembly;

    private static readonly Assembly ApiHost = typeof(Program).Assembly;

    [Fact]
    public void Module_must_not_depend_on_another_modules_implementation()
    {
        foreach (var assembly in ModuleAssemblies)
        {
            var ownName = assembly.GetName().Name!;

            // Every module implementation assembly EXCEPT this one.
            var forbidden = ModuleAssemblies
                .Select(other => other.GetName().Name!)
                .Where(name => name != ownName)
                .ToArray();

            if (forbidden.Length == 0)
            {
                continue;
            }

            // Assembly references, NOT NetArchTest namespace matching.
            // NetArchTest matches by name PREFIX, so "BuddyIO.Modules.Profiles"
            // also matches "BuddyIO.Modules.Profiles.Contracts" - which would
            // flag the one dependency that is explicitly allowed.
            var referenced = ReferencedAssemblyNames(assembly);
            var violations = referenced.Intersect(forbidden, StringComparer.Ordinal).ToArray();

            violations.ShouldBeEmpty(
                $"{ownName} may only reach another module through its "
                + $"{ContractsSuffix} assembly, but references: {string.Join(", ", violations)}");
        }
    }

    [Fact]
    public void Shared_kernel_must_not_depend_on_any_module()
    {
        // The shared kernel is referenced by everything. If it could reference a
        // module, every module would transitively depend on that one, and the
        // dependency graph would quietly become a ball of mud.
        var result = Types.InAssembly(SharedKernel)
            .ShouldNot()
            .HaveDependencyOn(ModuleNamespacePrefix)
            .GetResult();

        result.IsSuccessful.ShouldBeTrue(
            $"The shared kernel must stay module-agnostic. Offending types: {Describe(result)}");
    }

    [Fact]
    public void Modules_must_not_depend_on_the_api_host()
    {
        // Dependencies point inward. A module that knows about the host cannot
        // be extracted into its own service without unpicking that knowledge.
        var hostName = ApiHost.GetName().Name!;

        foreach (var assembly in ModuleAssemblies)
        {
            ReferencedAssemblyNames(assembly).ShouldNotContain(
                hostName,
                $"{assembly.GetName().Name} must not reference the API host.");
        }
    }

    [Fact]
    public void Domain_types_must_not_depend_on_entity_framework()
    {
        // Persistence is an infrastructure concern. Domain types that reference
        // EF Core cannot be unit-tested without a provider, and tend to grow
        // navigation properties that encode storage decisions into the model.
        foreach (var assembly in ModuleAssemblies)
        {
            var result = Types.InAssembly(assembly)
                .That()
                .ResideInNamespaceEndingWith(".Domain")
                .ShouldNot()
                .HaveDependencyOn("Microsoft.EntityFrameworkCore")
                .GetResult();

            result.IsSuccessful.ShouldBeTrue(
                $"Domain types in {assembly.GetName().Name} must stay persistence-free. "
                + $"Offending types: {Describe(result)}");
        }
    }

    [Fact]
    public void Contracts_must_not_depend_on_module_implementations()
    {
        // A contracts assembly is what OTHER modules reference. If it depended
        // on the implementation, referencing the contract would drag the whole
        // module in and the boundary would be decorative.
        var contractAssemblies = ModuleAssemblies
            .SelectMany(assembly => assembly.GetReferencedAssemblies())
            .Where(name => name.Name?.EndsWith(ContractsSuffix, StringComparison.Ordinal) == true)
            .Select(name => Assembly.Load(name))
            .DistinctBy(assembly => assembly.GetName().Name)
            .ToArray();

        contractAssemblies.ShouldNotBeEmpty(
            "No *.Contracts assembly was found - this test would otherwise pass vacuously.");

        foreach (var contracts in contractAssemblies)
        {
            var implementationNames = ModuleAssemblies
                .Select(assembly => assembly.GetName().Name!)
                .ToArray();

            var violations = ReferencedAssemblyNames(contracts)
                .Intersect(implementationNames, StringComparer.Ordinal)
                .ToArray();

            violations.ShouldBeEmpty(
                $"{contracts.GetName().Name} must not reference a module implementation, "
                + $"but references: {string.Join(", ", violations)}");
        }
    }

    [Fact]
    public void Every_module_must_expose_exactly_one_registration_entry_point()
    {
        // Composition happens through one documented type per module. Without
        // this, the host slowly accumulates direct knowledge of module internals.
        foreach (var assembly in ModuleAssemblies)
        {
            var entryPoints = assembly.GetTypes()
                .Where(type => type is { IsClass: true, IsAbstract: true, IsSealed: true })
                .Where(type => type.IsPublic && type.Name.EndsWith("Module", StringComparison.Ordinal))
                .ToArray();

            entryPoints.Length.ShouldBe(
                1,
                $"{assembly.GetName().Name} should expose exactly one public static *Module "
                + $"entry point, found {entryPoints.Length}.");
        }
    }

    /// <summary>
    /// Exact assembly-reference names, for rules where prefix matching lies.
    /// </summary>
    private static string[] ReferencedAssemblyNames(Assembly assembly) =>
        assembly.GetReferencedAssemblies()
            .Select(name => name.Name)
            .Where(name => name is not null)
            .Select(name => name!)
            .ToArray();

    private static string Describe(TestResult result) =>
        result.FailingTypeNames is { Count: > 0 }
            ? string.Join(", ", result.FailingTypeNames)
            : "(none reported)";
}
