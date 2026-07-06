using AmrProdSeg.API.Application.DTOs;
using FluentValidation;

namespace AmrProdSeg.API.Application.Validators;

public class CrearClienteValidator : AbstractValidator<CrearClienteDto>
{
    public CrearClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre es obligatorio.")
            .MinimumLength(3).WithMessage("El nombre debe tener al menos 3 caracteres.")
            .MaximumLength(150)
            .Matches(@"^[\p{L}\p{N}\s\.\-,'&/°º]+$")
            .WithMessage("El nombre contiene caracteres no permitidos.");

        RuleFor(x => x.Documento)
            .NotEmpty().WithMessage("El documento es obligatorio.")
            .MaximumLength(20)
            .Matches(@"^\d{7,11}$")
            .WithMessage("El documento debe contener solo dígitos (7 a 11).");

        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("El email no tiene un formato válido.")
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public class EndosoTitularValidator : AbstractValidator<EndosoTitularDto>
{
    public EndosoTitularValidator()
    {
        RuleFor(x => x.ClienteNombre)
            .NotEmpty().WithMessage("El nombre del nuevo titular es obligatorio.")
            .MinimumLength(3).MaximumLength(150)
            .Matches(@"^[\p{L}\p{N}\s\.\-,'&/°º]+$")
            .WithMessage("El nombre contiene caracteres no permitidos.");

        RuleFor(x => x.Documento)
            .NotEmpty().Matches(@"^\d{7,11}$")
            .WithMessage("El documento debe contener solo dígitos (7 a 11).");

        RuleFor(x => x.Email)
            .EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public class ActualizarClienteValidator : AbstractValidator<ActualizarClienteDto>
{
    public ActualizarClienteValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().MinimumLength(3).MaximumLength(150)
            .Matches(@"^[\p{L}\p{N}\s\.\-,'&/°º]+$");

        RuleFor(x => x.Email)
            .EmailAddress()
            .When(x => !string.IsNullOrEmpty(x.Email));
    }
}

public class CrearVehiculoValidator : AbstractValidator<CrearVehiculoDto>
{
    public CrearVehiculoValidator()
    {
        RuleFor(x => x.ClienteId).GreaterThan(0);
        RuleFor(x => x.Marca).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Modelo).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Patente).NotEmpty().MaximumLength(10);
        RuleFor(x => x.Anio)
            .InclusiveBetween((short)1950, (short)(DateTime.UtcNow.Year + 1))
            .WithMessage($"El año debe estar entre 1950 y {DateTime.UtcNow.Year + 1}.");
    }
}

public class ActualizarVehiculoValidator : AbstractValidator<ActualizarVehiculoDto>
{
    public ActualizarVehiculoValidator()
    {
        RuleFor(x => x.Marca).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Modelo).NotEmpty().MaximumLength(60);
        RuleFor(x => x.Anio)
            .InclusiveBetween((short)1950, (short)(DateTime.UtcNow.Year + 1));
    }
}

public class CrearPolizaValidator : AbstractValidator<CrearPolizaDto>
{
    public CrearPolizaValidator()
    {
        RuleFor(x => x.ClienteId).GreaterThan(0);
        RuleFor(x => x.VehiculoId!.Value).GreaterThan(0).When(x => x.VehiculoId.HasValue);
        RuleFor(x => x.CompaniaId).GreaterThan(0);
        RuleFor(x => x.PrecioTotal).GreaterThan(0).WithMessage("El precio total debe ser mayor a 0.");
        RuleFor(x => x.CantidadCuotas)
            .InclusiveBetween(1, 24).WithMessage("La cantidad de cuotas debe estar entre 1 y 24.");
        RuleFor(x => x.FechaInicio)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("La fecha de inicio no puede ser anterior a hoy.");
        RuleFor(x => x.FechaFin)
            .GreaterThan(x => x.FechaInicio)
            .WithMessage("La fecha de fin debe ser posterior a la de inicio.");
    }
}

public class AltaAseguradoValidator : AbstractValidator<AltaAseguradoDto>
{
    public AltaAseguradoValidator()
    {
        // Cliente
        RuleFor(x => x.ClienteNombre)
            .NotEmpty().MinimumLength(3).MaximumLength(150)
            .Matches(@"^[\p{L}\p{N}\s\.\-,'&/°º]+$")
            .WithMessage("El nombre contiene caracteres no permitidos.");
        RuleFor(x => x.Documento)
            .NotEmpty().Matches(@"^\d{7,11}$")
            .WithMessage("El documento debe contener solo dígitos (7 a 11).");
        RuleFor(x => x.Email).EmailAddress().When(x => !string.IsNullOrEmpty(x.Email));

        // Vehículo (opcional: sólo si el ramo lo requiere → se valida cuando hay patente)
        RuleFor(x => x.Marca).NotEmpty().MaximumLength(60).When(x => !string.IsNullOrWhiteSpace(x.Patente));
        RuleFor(x => x.Modelo).NotEmpty().MaximumLength(60).When(x => !string.IsNullOrWhiteSpace(x.Patente));
        RuleFor(x => x.Patente).MaximumLength(10);
        RuleFor(x => x.Anio!.Value)
            .InclusiveBetween((short)1950, (short)(DateTime.UtcNow.Year + 1))
            .When(x => x.Anio.HasValue);

        // Póliza
        RuleFor(x => x.CompaniaId).GreaterThan(0);
        RuleFor(x => x.PrecioTotal).GreaterThan(0);
        RuleFor(x => x.CantidadCuotas).InclusiveBetween(1, 24);
        RuleFor(x => x.FechaInicio)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("La fecha de inicio no puede ser anterior a hoy.");
        RuleFor(x => x.FechaFin)
            .GreaterThan(x => x.FechaInicio)
            .WithMessage("La fecha de fin debe ser posterior a la de inicio.");
    }
}

public class RenovarPolizaValidator : AbstractValidator<RenovarPolizaDto>
{
    public RenovarPolizaValidator()
    {
        RuleFor(x => x.PrecioTotal).GreaterThan(0);
        RuleFor(x => x.CantidadCuotas).InclusiveBetween(1, 24);
        RuleFor(x => x.FechaFin)
            .GreaterThan(x => x.FechaInicio)
            .WithMessage("La fecha de fin debe ser posterior a la de inicio.");
    }
}

public class CrearCompaniaValidator : AbstractValidator<CrearCompaniaDto>
{
    public CrearCompaniaValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(100);
    }
}

public class CrearMetodoPagoValidator : AbstractValidator<CrearMetodoPagoDto>
{
    public CrearMetodoPagoValidator()
    {
        RuleFor(x => x.Nombre)
            .NotEmpty().WithMessage("El nombre del método de pago es obligatorio.")
            .MaximumLength(60);
    }
}

public class LoginValidator : AbstractValidator<LoginDto>
{
    public LoginValidator()
    {
        RuleFor(x => x.Email).NotEmpty().WithMessage("El email es obligatorio.");
        RuleFor(x => x.Password).NotEmpty().WithMessage("La contraseña es obligatoria.");
    }
}

public class CrearUsuarioValidator : AbstractValidator<CrearUsuarioDto>
{
    public CrearUsuarioValidator()
    {
        RuleFor(x => x.Nombre).NotEmpty().MaximumLength(150);
        RuleFor(x => x.Email).NotEmpty().EmailAddress().MaximumLength(100);
        RuleFor(x => x.Password)
            .NotEmpty().MinimumLength(8)
            .WithMessage("La contraseña debe tener al menos 8 caracteres.");
        RuleFor(x => x.Rol)
            .Must(r => r is "Admin" or "Productor")
            .WithMessage("El rol debe ser 'Admin' o 'Productor'.");
    }
}

public class CambiarPasswordValidator : AbstractValidator<CambiarPasswordDto>
{
    public CambiarPasswordValidator()
    {
        RuleFor(x => x.PasswordActual).NotEmpty();
        RuleFor(x => x.PasswordNuevo)
            .NotEmpty().MinimumLength(8)
            .WithMessage("La nueva contraseña debe tener al menos 8 caracteres.");
    }
}

public class ConfirmarResetValidator : AbstractValidator<ConfirmarResetDto>
{
    public ConfirmarResetValidator()
    {
        RuleFor(x => x.Email).NotEmpty().EmailAddress();
        RuleFor(x => x.NuevaPassword)
            .NotEmpty().MinimumLength(8)
            .WithMessage("La nueva contraseña debe tener al menos 8 caracteres.");
    }
}

public class ActualizarDocumentoValidator : AbstractValidator<ActualizarDocumentoDto>
{
    public ActualizarDocumentoValidator()
    {
        RuleFor(x => x.Documento)
            .NotEmpty()
            .Matches(@"^\d{7,11}$")
            .WithMessage("El documento debe contener solo dígitos (7 a 11).");
    }
}
