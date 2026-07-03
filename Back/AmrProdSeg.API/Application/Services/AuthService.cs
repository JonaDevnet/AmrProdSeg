using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Infrastructure.Interfaces;
using AmrProdSeg.API.Security.Helpers;

namespace AmrProdSeg.API.Application.Services;

public class AuthService : IAuthService
{
    private readonly IAuthRepository _authRepo;
    private readonly IUsuarioRepository _usuarioRepo;
    private readonly IResetRepository _resetRepo;
    private readonly JwtHelper _jwtHelper;
    private readonly IConfiguration _config;

    public AuthService(
        IAuthRepository authRepo,
        IUsuarioRepository usuarioRepo,
        IResetRepository resetRepo,
        JwtHelper jwtHelper,
        IConfiguration config)
    {
        _authRepo    = authRepo;
        _usuarioRepo = usuarioRepo;
        _resetRepo   = resetRepo;
        _jwtHelper   = jwtHelper;
        _config      = config;
    }

    public async Task<LoginResultDto> LoginAsync(LoginDto dto)
    {
        var usuario = await _authRepo.GetUsuarioByEmailAsync(dto.Email);
        if (usuario == null || !BCrypt.Net.BCrypt.Verify(dto.Password, usuario.PasswordHash))
            throw new BusinessException("Credenciales inválidas.");

        return await EmitirTokensAsync(usuario.Id, usuario.Email, usuario.Rol, usuario.Nombre);
    }

    public async Task<LoginResultDto> RefreshAsync(string refreshToken)
    {
        var refresh = await _authRepo.GetRefreshTokenAsync(refreshToken);
        if (refresh == null || refresh.Revocado || refresh.Expiracion < DateTime.UtcNow)
            throw new BusinessException("Refresh token inválido o expirado.");

        // Rotación: revocar el token usado
        await _authRepo.RevocarRefreshTokenAsync(refreshToken);

        var usuario = await _authRepo.GetUsuarioByIdAsync(refresh.UsuarioId)
            ?? throw new NotFoundException("Usuario no encontrado.");

        return await EmitirTokensAsync(usuario.Id, usuario.Email, usuario.Rol, usuario.Nombre);
    }

    public Task LogoutAsync(string refreshToken)
        => _authRepo.RevocarRefreshTokenAsync(refreshToken);

    // El vendedor pide restablecer; queda pendiente de autorización del Admin.
    public async Task SolicitarResetAsync(string email)
    {
        var usuario = await _authRepo.GetUsuarioByEmailAsync(email);
        if (usuario != null)
            await _resetRepo.SolicitarAsync(usuario.Id, email);
        // Silencioso: no revelamos si el email existe.
    }

    // El vendedor define su nueva contraseña, sólo si el Admin autorizó la solicitud.
    public async Task ConfirmarResetAsync(string email, string nuevaPassword)
    {
        var solicitud = await _resetRepo.GetAutorizadaPorEmailAsync(email)
            ?? throw new BusinessException(
                "No hay un cambio de contraseña autorizado para este email. Pedile al administrador que lo autorice.");

        var hash = BCrypt.Net.BCrypt.HashPassword(nuevaPassword);
        await _usuarioRepo.CambiarPasswordAsync(solicitud.UsuarioId, hash);
        await _resetRepo.CompletarAsync(solicitud.Id);
    }

    private async Task<LoginResultDto> EmitirTokensAsync(int usuarioId, string email, string rol, string nombre)
    {
        var accessToken  = _jwtHelper.GenerarToken(usuarioId, email, rol);
        var refreshToken = Guid.NewGuid().ToString();
        var dias         = int.Parse(_config["Jwt:RefreshDays"]!);

        await _authRepo.GuardarRefreshTokenAsync(usuarioId, refreshToken, DateTime.UtcNow.AddDays(dias));

        return new LoginResultDto
        {
            AccessToken  = accessToken,
            RefreshToken = refreshToken,
            Nombre       = nombre,
            Rol          = rol
        };
    }
}
