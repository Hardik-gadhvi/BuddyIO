using System.Diagnostics;
using Asp.Versioning;
using BuddyIO.Api.Infrastructure;
using BuddyIO.Modules.Identity;
using BuddyIO.SharedKernel.Abstractions;
using BuddyIO.SharedKernel.Errors;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Identity;
using OpenTelemetry.Metrics;
using OpenTelemetry.Resources;
using OpenTelemetry.Trace;
using Scalar.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

// ---------------------------------------------------------------- platform --

builder.Services.AddSingleton<IClock, SystemClock>();

// Problem Details for EVERY failure path, including the ones the framework
// produces itself (404s, 415s, malformed JSON, an auth challenge) - not just
// thrown exceptions.
//
// CustomizeProblemDetails is what makes the contract uniform. Without it, a
// 401 raised by the auth middleware comes back as a bare RFC 9110 problem with
// no `code` and no `correlationId`, so a client that branches on `code` would
// have to special-case exactly the responses it is least able to predict.
builder.Services.AddProblemDetails(options =>
    options.CustomizeProblemDetails = context =>
    {
        var problem = context.ProblemDetails;

        problem.Extensions.TryAdd(
            "correlationId",
            Activity.Current?.TraceId.ToString() ?? context.HttpContext.TraceIdentifier);

        problem.Extensions.TryAdd("code", problem.Status switch
        {
            StatusCodes.Status400BadRequest => ErrorCodes.ValidationFailed,
            StatusCodes.Status401Unauthorized => ErrorCodes.Unauthenticated,
            StatusCodes.Status403Forbidden => ErrorCodes.Forbidden,
            StatusCodes.Status404NotFound => ErrorCodes.NotFound,
            StatusCodes.Status409Conflict => ErrorCodes.Conflict,
            StatusCodes.Status429TooManyRequests => ErrorCodes.RateLimited,
            >= 500 => ErrorCodes.Unknown,
            _ => ErrorCodes.RequestFailed,
        });
    });
builder.Services.AddExceptionHandler<AppExceptionHandler>();

builder.Services.AddApiVersioning(options =>
    {
        options.DefaultApiVersion = new ApiVersion(1, 0);
        options.AssumeDefaultVersionWhenUnspecified = true;
        options.ReportApiVersions = true;
        // The version is in the URL segment: /api/v1/... . Header-based
        // versioning is invisible in logs, browsers and curl commands, which
        // makes support conversations much harder than they need to be.
        options.ApiVersionReader = new UrlSegmentApiVersionReader();
    });
// No AddApiExplorer here: that extension lives in Asp.Versioning.Mvc.ApiExplorer
// and exists to describe CONTROLLER actions. This API is minimal endpoints, and
// AddOpenApi below discovers them directly.

builder.Services.AddOpenApi();

// ------------------------------------------------------------------- auth --

// Cookie-based sessions rather than bearer tokens in the browser. The spec is
// explicit: no long-lived access token in localStorage. An httpOnly cookie
// cannot be read by JavaScript at all, which removes the entire class of
// token-exfiltration-via-XSS bugs. See AuthEndpoints.AuthResponse.
builder.Services
    .AddAuthentication(IdentityConstants.ApplicationScheme)
    .AddCookie(IdentityConstants.ApplicationScheme, options =>
    {
        options.Cookie.Name = "buddyio.session";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
        options.ExpireTimeSpan = TimeSpan.FromDays(14);
        options.SlidingExpiration = true;

        // This is an API. A browser redirect to a login PAGE would hand the SPA
        // an HTML body where it expected JSON, so the challenge is a status code.
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            context.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// ------------------------------------------------------------------ CORS --

// The SPA runs on a different origin in development. Credentials are allowed
// because the session is a cookie, and an allow-list is mandatory the moment
// credentials are involved - AllowAnyOrigin is invalid with them for good reason.
const string SpaCorsPolicy = "buddyio-spa";
var allowedOrigins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
    ?? ["http://localhost:4200"];

builder.Services.AddCors(options =>
    options.AddPolicy(SpaCorsPolicy, policy => policy
        .WithOrigins(allowedOrigins)
        .AllowCredentials()
        .AllowAnyHeader()
        .AllowAnyMethod()));

// --------------------------------------------------------- observability --

builder.Services.AddOpenTelemetry()
    .ConfigureResource(resource => resource.AddService(
        serviceName: "buddyio-api",
        serviceVersion: typeof(Program).Assembly.GetName().Version?.ToString() ?? "0.1.0"))
    .WithTracing(tracing => tracing
        .AddAspNetCoreInstrumentation(options =>
            // Health probes would otherwise dominate the trace volume and tell
            // us nothing.
            options.Filter = context => !context.Request.Path.StartsWithSegments("/health"))
        .AddHttpClientInstrumentation()
        // Npgsql publishes its own ActivitySource. Subscribing by name avoids a
        // package whose extension method has moved between versions.
        .AddSource("Npgsql")
        .AddOtlpExporter())
    .WithMetrics(metrics => metrics
        .AddAspNetCoreInstrumentation()
        .AddHttpClientInstrumentation()
        .AddRuntimeInstrumentation()
        .AddOtlpExporter());

builder.Services.AddHealthChecks();

// ---------------------------------------------------------------- modules --

builder.Services.AddIdentityModule(builder.Configuration);

var app = builder.Build();

// ------------------------------------------------------------- middleware --

app.UseExceptionHandler();
// Turns a bare 404/405 from routing into Problem Details too, so a client never
// has to handle two different error shapes.
app.UseStatusCodePages();

app.UseCors(SpaCorsPolicy);

app.UseAuthentication();
app.UseAuthorization();

// Liveness vs readiness: liveness must not depend on the database, or a brief
// database blip gets the container killed and restarted instead of just
// removed from the load balancer.
app.MapHealthChecks("/health/live", new()
{
    Predicate = _ => false,
});
app.MapHealthChecks("/health/ready");

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
    app.MapScalarApiReference(options => options.WithTitle("BuddyIO API"));
}

// ------------------------------------------------------------------ routes --

var v1 = app
    .MapGroup("/api/v{version:apiVersion}")
    .WithApiVersionSet(app.NewApiVersionSet().HasApiVersion(new ApiVersion(1, 0)).Build());

v1.MapIdentityEndpoints();

app.Run();

/// <summary>Exposed so the integration tests can boot this host.</summary>
public partial class Program;
