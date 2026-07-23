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
    private readonly IVehiculoRepository _vehiculoRepo;
    private readonly IPolizaRepository _polizaRepo;
    private readonly ICompaniaRepository _companiaRepo;
    private readonly IPdfService _pdf;

    public ClienteService(IClienteRepository clienteRepo, IUsuarioRepository usuarioRepo,
        IVehiculoRepository vehiculoRepo, IPolizaRepository polizaRepo, ICompaniaRepository companiaRepo, IPdfService pdf)
    {
        _clienteRepo = clienteRepo;
        _usuarioRepo = usuarioRepo;
        _vehiculoRepo = vehiculoRepo;
        _polizaRepo = polizaRepo;
        _companiaRepo = companiaRepo;
        _pdf = pdf;
    }

    /// <summary>Genera la ficha completa del cliente en PDF (datos, vehículos y todas las pólizas).</summary>
    public async Task<byte[]> GenerarDossierPdfAsync(int clienteId, int? usuarioId, bool esAdmin)
    {
        var cliente = await _clienteRepo.GetByIdAsync(clienteId)
            ?? throw new NotFoundException("Cliente no encontrado.");
        var vehiculos = await _vehiculoRepo.GetPorClienteAsync(clienteId);
        var (polizas, _) = await _polizaRepo.ListarAsync(clienteId, null, 1, 1000, usuarioId, esAdmin);
        var companias = (await _companiaRepo.GetAllAsync()).ToDictionary(c => c.Id, c => c.Nombre);

        var data = new ClienteDossierData(
            cliente.Nombre, cliente.Documento, cliente.TipoDocumento, cliente.Email, cliente.Telefono,
            cliente.Direccion, cliente.FechaNacimiento, cliente.FechaAlta,
            vehiculos.Select(v => new DossierVehiculo(v.Patente, v.Marca, v.Modelo, v.Anio, v.Chasis, v.Motor, v.Combustion)).ToList(),
            polizas.Select(p => new DossierPoliza(
                p.Numero, p.Estado.ToString(),
                companias.TryGetValue(p.CompaniaId, out var cn) ? cn : "—",
                p.RamoNombre, p.Cobertura, p.Patente,
                p.FechaInicio, p.FechaFin, p.PrecioTotal, p.CantidadCuotas, p.FormaPago)).ToList());

        return _pdf.GenerarDossierCliente(data);
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
