using BuddyIO.Modules.Identity.Application;
using Shouldly;

namespace BuddyIO.Modules.Identity.Tests;

/// <summary>
/// The 13+ age gate (open question Q-03).
/// </summary>
/// <remarks>
/// Worth its own tests because the naive implementation - dividing elapsed days
/// by 365.25 - is wrong on exactly the days that matter: a birthday, and the day
/// before one. Leap years make it wrong more often than people expect.
/// </remarks>
public sealed class AgeGateTests
{
    private static readonly DateTimeOffset Now = new(2026, 8, 20, 12, 0, 0, TimeSpan.Zero);

    [Theory]
    [InlineData(2013, 8, 20, 13)] // Birthday is today: they ARE 13.
    [InlineData(2013, 8, 21, 12)] // Birthday is tomorrow: still 12.
    [InlineData(2013, 8, 19, 13)] // Birthday was yesterday.
    [InlineData(2000, 1, 1, 26)]
    [InlineData(2026, 8, 20, 0)] // Born today.
    public void Computes_whole_years_elapsed(int year, int month, int day, int expected)
    {
        AuthService.AgeOn(Now, new DateOnly(year, month, day)).ShouldBe(expected);
    }

    [Fact]
    public void Handles_a_leap_day_birthday_in_a_non_leap_year()
    {
        // Born 29 Feb 2012. On 28 Feb 2026 they have not yet had a birthday in
        // 2026, so they are 13. A days/365.25 implementation gets this wrong.
        var lateFebruary = new DateTimeOffset(2026, 2, 28, 0, 0, 0, TimeSpan.Zero);

        AuthService.AgeOn(lateFebruary, new DateOnly(2012, 2, 29)).ShouldBe(13);
    }

    [Fact]
    public void Treats_the_day_before_the_thirteenth_birthday_as_under_age()
    {
        var dayBefore = new DateOnly(Now.Year - 13, Now.Month, Now.Day).AddDays(1);

        AuthService.AgeOn(Now, dayBefore).ShouldBeLessThan(13);
    }

    [Fact]
    public void Treats_the_thirteenth_birthday_itself_as_eligible()
    {
        var exactlyThirteen = new DateOnly(Now.Year - 13, Now.Month, Now.Day);

        AuthService.AgeOn(Now, exactlyThirteen).ShouldBe(13);
    }
}
