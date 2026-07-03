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
        var existente = await _authRepo.GetUsuarioByEmailAsync(dto.Email);
        if (existente != null)
            throw new BusinessException($"Ya existe un usuario con el email {dto.Email}.");

        var hash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        return await _usuarioRepo.InsertarAsync(dto.Nombre, dto.Email, hash, dto.Rol);
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
}
