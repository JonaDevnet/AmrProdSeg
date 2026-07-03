using AmrProdSeg.API.Application.Exceptions;

namespace AmrProdSeg.API.Security.Middlewares;

public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(
        RequestDelegate next,
        ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next   = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (BusinessException ex)
        {
            await EscribirAsync(context, 400, ex.Message);
        }
        catch (NotFoundException ex)
        {
            await EscribirAsync(context, 404, ex.Message);
        }
        catch (UnauthorizedAccessException)
        {
            await EscribirAsync(context, 403, "No tenés permisos para realizar esta acción.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error no controlado en {Path}", context.Request.Path);
            await EscribirAsync(context, 500, "Ocurrió un error interno. Intentá nuevamente.");
        }
    }

    private static async Task EscribirAsync(HttpContext context, int statusCode, string error)
    {
        context.Response.StatusCode  = statusCode;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { error });
    }
}

public static class ExceptionHandlingExtensions
{
    public static IApplicationBuilder UseExceptionHandlingMiddleware(this IApplicationBuilder app)
        => app.UseMiddleware<ExceptionHandlingMiddleware>();
}
