namespace AmrProdSeg.API.Security.Middlewares;

public class SecurityHeadersMiddleware
{
    private readonly RequestDelegate _next;

    public SecurityHeadersMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var headers = context.Response.Headers;

        headers["X-Frame-Options"]            = "DENY";
        headers["Strict-Transport-Security"]  = "max-age=31536000; includeSubDomains";
        headers["X-Content-Type-Options"]     = "nosniff";
        headers["Referrer-Policy"]            = "strict-origin-when-cross-origin";
        headers["Permissions-Policy"]         = "camera=(), microphone=(), geolocation=()";
        headers["Content-Security-Policy"]    =
            "default-src 'self'; " +
            "script-src 'self'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: blob:; " +
            "font-src 'self'; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none';";

        headers.Remove("Server");
        headers.Remove("X-Powered-By");

        await _next(context);
    }
}

public static class SecurityHeadersExtensions
{
    public static IApplicationBuilder UseSecurityHeaders(this IApplicationBuilder app)
        => app.UseMiddleware<SecurityHeadersMiddleware>();
}
