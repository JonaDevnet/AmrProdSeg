using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Interfaces;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Infrastructure.Interfaces;

namespace AmrProdSeg.API.Application.Services;

public class ClienteService : IClienteService
{
    private readonly IClienteRepository _clienteRepo;
    private readonly IUsuarioRepository _usuarioRepo;

    public ClienteService(IClienteRepository clienteRepo, IUsuarioRepository usuarioRepo)
    {
        _clienteRepo = clienteRepo;
        _usuarioRepo = usuarioRepo;
    }

    public async Task<int> CrearAsync(CrearClienteDto dto, int? usuarioId = null)
    {
        var existente = await _clienteRepo.VerificarDocumentoAsync(dto.Documento);
        if (existente != null)
            throw new BusinessException($"Ya existe un cliente con el documento {dto.Documento}.");

        // El cliente hereda la oficina del usuario que lo crea (si tiene una asignada).
        int? oficinaId = usuarioId is int uid ? await _usuarioRepo.GetOficinaIdAsync(uid) : null;

        var cliente = new Cliente
        {
            Nombre    = dto.Nombre,
            Documento = dto.Documento,
            Email     = dto.Email,
            Telefono  = dto.Telefono,
            Direccion = dto.Direccion,
            TipoDocumento = dto.TipoDocumento,
            FechaNacimiento = dto.FechaNacimiento,
            OficinaId = oficinaId,
            VendedorId = usuarioId
        };
        return await _clienteRepo.InsertarAsync(cliente);
    }

    public async Task ActualizarAsync(int id, ActualizarClienteDto dto)
    {
        var cliente = await _clienteRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Cliente no encontrado.");

        cliente.Nombre    = dto.Nombre;
        cliente.Email     = dto.Email;
        cliente.Telefono  = dto.Telefono;
        cliente.Direccion = dto.Direccion;
        cliente.TipoDocumento = dto.TipoDocumento;
        cliente.FechaNacimiento = dto.FechaNacimiento;

        await _clienteRepo.ActualizarAsync(cliente);
    }

    public async Task ActualizarDocumentoAsync(int id, string nuevoDocumento, int usuarioId)
    {
        _ = await _clienteRepo.GetByIdAsync(id)
            ?? throw new NotFoundException("Cliente no encontrado.");

        var existente = await _clienteRepo.VerificarDocumentoAsync(nuevoDocumento);
        if (existente != null && existente.Id != id)
            throw new BusinessException($"El documento {nuevoDocumento} ya pertenece a otro cliente.");

        await _clienteRepo.ActualizarDocumentoAsync(id, nuevoDocumento, usuarioId);
    }

    public Task<Cliente?> GetByIdAsync(int id) => _clienteRepo.GetByIdAsync(id);

    public async Task<PagedResult<Cliente>> BuscarAsync(string termino, int page, int pageSize, int? usuarioId = null, bool esAdmin = false)
    {
        var (items, total) = await _clienteRepo.BuscarAsync(termino ?? string.Empty, page, pageSize, usuarioId, esAdmin);
        return new PagedResult<Cliente>
        {
            Items    = items,
            Total    = total,
            Page     = page,
            PageSize = pageSize
        };
    }
}
