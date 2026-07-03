using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace AmrProdSeg.API.Security.Filters;

/// <summary>
/// Ejecuta automáticamente el IValidator&lt;T&gt; registrado para cada argumento
/// de la acción. Si alguno falla, corta con 400 y la lista de errores.
/// </summary>
public class ValidationFilter : IAsyncActionFilter
{
    private readonly IServiceProvider _services;

    public ValidationFilter(IServiceProvider services) => _services = services;

    public async Task OnActionExecutionAsync(ActionExecutingContext context, ActionExecutionDelegate next)
    {
        foreach (var argumento in context.ActionArguments.Values)
        {
            if (argumento is null) continue;

            var validatorType = typeof(IValidator<>).MakeGenericType(argumento.GetType());
            if (_services.GetService(validatorType) is not IValidator validator) continue;

            var validationContext = new ValidationContext<object>(argumento);
            var resultado = await validator.ValidateAsync(validationContext);

            if (!resultado.IsValid)
            {
                var errores = resultado.Errors
                    .GroupBy(e => e.PropertyName)
                    .ToDictionary(g => g.Key, g => g.Select(e => e.ErrorMessage).ToArray());

                context.Result = new BadRequestObjectResult(new { error = "Validación fallida.", detalles = errores });
                return;
            }
        }

        await next();
    }
}
