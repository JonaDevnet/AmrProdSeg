using System.Text;
using System.Text.RegularExpressions;
using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class AnuncioService : IAnuncioService
{
    private const int MaxTitulo = 120;
    private const int MaxSubtitulo = 200;
    private const int MaxTexto = 5000;

    private readonly IAnuncioRepository _repo;
    private readonly INotificacionPusher _pusher;
    private readonly IAuditoriaMovimientoService _auditoria;

    public AnuncioService(IAnuncioRepository repo, INotificacionPusher pusher, IAuditoriaMovimientoService auditoria)
    {
        _repo = repo;
        _pusher = pusher;
        _auditoria = auditoria;
    }

    public async Task<PagedResult<AnuncioDto>> GetAllAsync(int page, int pageSize)
    {
        page = Math.Max(1, page);
        pageSize = Math.Clamp(pageSize, 1, 50);

        var (items, total) = await _repo.GetAllAsync(page, pageSize);
        return new PagedResult<AnuncioDto>
        {
            Items = items.Select(Map).ToList(),
            Total = total,
            Page = page,
            PageSize = pageSize,
        };
    }

    public async Task<AnunciosNuevosDto> GetNuevosAsync(int usuarioId)
    {
        if (usuarioId <= 0)
            return new AnunciosNuevosDto();

        var (items, total) = await _repo.GetNuevosAsync(usuarioId);
        return new AnunciosNuevosDto
        {
            Total = total,
            Items = items.Select(a => new AnuncioNuevoDto
            {
                Id = a.Id,
                Titulo = a.Titulo,
                Subtitulo = a.Subtitulo,
                FechaPublicacion = ComoUtc(a.FechaPublicacion),
            }).ToList(),
        };
    }

    public async Task<int> CrearAsync(int usuarioId, CrearAnuncioDto dto)
    {
        var titulo = LimpiarLinea(dto.Titulo);
        var subtitulo = LimpiarLinea(dto.Subtitulo);
        var texto = LimpiarTexto(dto.Texto);

        if (titulo.Length == 0)
            throw new BusinessException("El título es obligatorio.");
        if (titulo.Length > MaxTitulo)
            throw new BusinessException($"El título no puede superar los {MaxTitulo} caracteres.");
        if (subtitulo.Length > MaxSubtitulo)
            throw new BusinessException($"El subtítulo no puede superar los {MaxSubtitulo} caracteres.");
        if (texto.Length == 0)
            throw new BusinessException("El texto es obligatorio.");
        if (texto.Length > MaxTexto)
            throw new BusinessException($"El texto no puede superar los {MaxTexto} caracteres.");

        var id = await _repo.InsertarAsync(titulo, subtitulo.Length == 0 ? null : subtitulo, texto, usuarioId);

        await _auditoria.RegistrarAsync(usuarioId, "Anuncio", id, "Publicar", $"Publicó el anuncio \"{titulo}\".");
        await _pusher.NotificarAsync("notificaciones");
        return id;
    }

    public Task MarcarVistosAsync(int usuarioId, int hastaId)
    {
        if (usuarioId <= 0)
            throw new BusinessException("Usuario inválido.");
        return _repo.MarcarVistosAsync(usuarioId, Math.Max(0, hastaId));
    }

    public async Task EliminarAsync(int id, int usuarioId)
    {
        if (await _repo.EliminarAsync(id) == 0)
            throw new NotFoundException("Anuncio no encontrado.");

        await _auditoria.RegistrarAsync(usuarioId, "Anuncio", id, "Eliminar", $"Eliminó el anuncio #{id}.");
        await _pusher.NotificarAsync("notificaciones");
    }

    private static AnuncioDto Map(Anuncio a) => new()
    {
        Id = a.Id,
        Titulo = a.Titulo,
        Subtitulo = a.Subtitulo,
        Texto = a.Texto,
        PublicadoPor = a.PublicadoPor,
        UsuarioNombre = a.UsuarioNombre,
        UsuarioEmail = a.UsuarioEmail,
        FechaPublicacion = ComoUtc(a.FechaPublicacion),
    };

    private static DateTime ComoUtc(DateTime fecha)
        => DateTime.SpecifyKind(fecha, DateTimeKind.Utc);

    private static string LimpiarLinea(string? valor)
    {
        var limpio = LimpiarTexto(valor);
        return Regex.Replace(limpio, @"\s+", " ").Trim();
    }

    private static string LimpiarTexto(string? valor)
    {
        if (string.IsNullOrEmpty(valor)) return string.Empty;

        var sb = new StringBuilder(valor.Length);
        foreach (var c in valor)
        {
            // Se permiten saltos de línea y tabulaciones; el resto de controles se descarta.
            if (!char.IsControl(c) || c is '\r' or '\n' or '\t')
                sb.Append(c);
        }
        return sb.ToString().Trim();
    }
}
