using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class UsuarioService : IUsuarioService
{
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IAuthRepository _authRepo;
    private readonly IResetRepository _resetRepo;

    public UsuarioService(
        IUsuarioRepository usuarioRepo,
        IAuthRepository authRepo,
        IResetRepository resetRepo)
    {
        _usuarioRepo = usuarioRepo;
        _authRepo    = authRepo;
        _resetRepo   = resetRepo;
    }

    public async Task<int> CrearAsync(CrearUsuarioDto dto)
    {
        var email = (dto.Email ?? string.Empty).Trim();
        var nombre = (dto.Nombre ?? string.Empty).Trim();

        // La baja de usuarios es lógica: el email sigue ocupando el UNIQUE. Si el
        // usuario existe inactivo, se reactiva la MISMA fila (conserva Id e historial).
        var existente = await _authRepo.GetUsuarioByEmailInclInactivoAsync(email);

        if (existente is { Activo: true })
            throw new BusinessException($"Ya existe un usuario con el email {email}.");

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);

        if (existente is { Activo: false })
        {
            var reactivado = await _usuarioRepo.ReactivarAsync(existente.Id, nombre, hash, dto.Rol);
            if (reactivado == 0)
                throw new BusinessException("No se pudo reactivar el usuario.");
            return existente.Id;
        }

        var id = await _usuarioRepo.InsertarAsync(nombre, email, hash, dto.Rol);
        if (id <= 0)
            throw new BusinessException($"Ya existe un usuario con el email {email}.");
        return id;
    }

    public async Task CambiarPasswordAsync(int usuarioId, CambiarPasswordDto dto)
    {
        var usuario = await _authRepo.GetUsuarioByIdAsync(usuarioId)
            ?? throw new NotFoundException("Usuario no encontrado.");

        if (!BCrypt.Net.BCrypt.Verify(dto.PasswordActual, usuario.PasswordHash))
            throw new BusinessException("La contraseña actual es incorrecta.");

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.PasswordNuevo);
        await _usuarioRepo.CambiarPasswordAsync(usuarioId, hash);
    }

    public async Task<List<UsuarioDto>> GetAllAsync()
    {
        var usuarios = await _usuarioRepo.GetAllAsync();
        return usuarios.Select(u => new UsuarioDto
        {
            Id        = u.Id,
            Nombre    = u.Nombre,
            Email     = u.Email,
            Rol       = u.Rol,
            Activo    = u.Activo,
            FechaAlta = u.FechaAlta,
            OficinaId = u.OficinaId,
            OficinaNombre = u.OficinaNombre
        }).ToList();
    }

    public Task<List<SolicitudReset>> GetSolicitudesResetAsync()
        => _resetRepo.GetPendientesAsync();

    public async Task AutorizarResetAsync(int id, int adminId)
    {
        var ok = await _resetRepo.AutorizarAsync(id, adminId);
        if (!ok)
            throw new NotFoundException("La solicitud no existe o ya fue procesada.");
    }

    public Task AsignarOficinaAsync(int usuarioId, int? oficinaId)
        => _usuarioRepo.AsignarOficinaAsync(usuarioId, oficinaId);

    public async Task EliminarAsync(int id)
    {
        var r = await _usuarioRepo.EliminarAsync(id);
        if (r == 0) throw new NotFoundException("Usuario no encontrado.");
    }

    public async Task ActualizarRolAsync(int id, string rol)
    {
        var usuario = await _authRepo.GetUsuarioByIdAsync(id)
            ?? throw new NotFoundException("Usuario no encontrado.");

        // El rol de un SuperAdministrador es inmutable: es el nivel máximo y no se baja de categoría.
        if (string.Equals(usuario.Rol, "SuperAdmin", StringComparison.OrdinalIgnoreCase))
            throw new BusinessException("El rol de un SuperAdministrador no se puede modificar.");

        var permitido = new[] { "Vendedor", "Productor", "Admin", "SuperAdmin" };
        if (!permitido.Contains(rol))
            throw new BusinessException("Rol no válido.");
        var r = await _usuarioRepo.ActualizarRolAsync(id, rol);
        if (r == 0) throw new NotFoundException("Usuario no encontrado.");
    }
}
