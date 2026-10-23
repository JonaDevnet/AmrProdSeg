using AmrProdSeg.API.Application.DTOs;
using AmrProdSeg.API.Application.Exceptions;
using AmrProdSeg.API.Application.Services;
using AmrProdSeg.API.Domain;
using AmrProdSeg.API.Domain.Enums;
using Microsoft.Extensions.Configuration;

namespace AmrProdSeg.Tests;

public class CobroServiceTests
{
    private static CobroService Crear(FakeCobroRepository repo) => new(
        repo, new FakePolizaRepository(), new FakeClienteRepository(), new FakeCompaniaRepository(),
        new FakeVehiculoRepository(), new FakeMetodoPagoRepository(), new FakePdfService(),
        new ConfigurationBuilder().Build(), new FakeEmailSender(), new FakeWhatsAppSender());

    [Fact]
    public async Task PagarAsync_CuotaYaPagada_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pagado } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, 2));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_CuotaInexistente_LanzaNotFound()
    {
        var repo = new FakeCobroRepository { CobroPorId = null };
        var service = Crear(repo);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.PagarAsync(99, DateTime.UtcNow, 2));
    }

    [Fact]
    public async Task PagarAsync_SinMetodoDePago_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, null));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_CuotaPendiente_MarcaPagada()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente } };
        var service = Crear(repo);

        await service.PagarAsync(1, DateTime.UtcNow, 2);

        Assert.Equal(1, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_ConDosMetodosYMonto_MarcaPagada()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente, Monto = 10000m } };
        var service = Crear(repo);

        await service.PagarAsync(1, DateTime.UtcNow, 1, null, 2, 4000m);

        Assert.Equal(1, repo.MarcarPagadoLlamadas);
    }

    [Fact]
    public async Task PagarAsync_SegundoMetodoSinMonto_LanzaBusinessException()
    {
        var repo = new FakeCobroRepository { CobroPorId = new Cobro { Id = 1, Estado = EstadoCobro.Pendiente, Monto = 10000m } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.PagarAsync(1, DateTime.UtcNow, 1, null, 2));
        Assert.Equal(0, repo.MarcarPagadoLlamadas);
    }
}

public class PolizaServiceTests
{
    private static PolizaService Crear(FakePolizaRepository polizaRepo)
        => new(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(), new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

    [Fact]
    public async Task ActualizarAsync_RegistraAuditoriaConPolizaYPatente()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza
            {
                Id = 1, Numero = "E/T-000020", Patente = "AB123CD", CompaniaId = 1,
                PrecioTotal = 50000, CantidadCuotas = 6
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1, FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddMonths(6),
            PrecioTotal = 50000, CantidadCuotas = 6
        }, usuarioId: 9);

        var r = Assert.Single(auditoria.Registros);
        Assert.Contains("E/T-000020", r.detalle);
        Assert.Contains("AB123CD", r.detalle);
    }

    [Fact]
    public async Task ActualizarAsync_CambiaPeriodo_NoAgregaCicloNiTocaCuotas()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza
            {
                Id = 1, Numero = "E/T-1", CompaniaId = 1,
                FechaInicio = new DateTime(2026, 7, 21), FechaFin = new DateTime(2026, 10, 21),
                PrecioTotal = 99000, CantidadCuotas = 3
            }
        };
        var cobroRepo = new FakeCobroRepository();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1,
            FechaInicio = new DateTime(2026, 7, 21), FechaFin = new DateTime(2027, 7, 21),
            PrecioTotal = 99000, CantidadCuotas = 3
        });

        Assert.Equal(1, polizaRepo.ActualizarLlamadas);
        Assert.Equal(0, polizaRepo.ActualizarConPlanLlamadas);
        Assert.Equal(0, polizaRepo.ModificacionPeriodoLlamadas);
        Assert.Equal(0, cobroRepo.AgregarCicloLlamadas);
        Assert.Equal(new DateTime(2026, 7, 21), polizaRepo.UltimaPolizaActualizada!.FechaInicio);
        Assert.Equal(new DateTime(2027, 7, 21), polizaRepo.UltimaPolizaActualizada.FechaFin);
    }

    [Fact]
    public async Task ActualizarAsync_SoloCambiaFin_NoAgregaCiclo()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza
            {
                Id = 1, Numero = "E/T-1", CompaniaId = 1,
                FechaInicio = new DateTime(2026, 7, 21), FechaFin = new DateTime(2026, 10, 21),
                PrecioTotal = 99000, CantidadCuotas = 3
            }
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { Id = 1, PolizaId = 1, NumeroCuota = 1, FechaVencimiento = new DateTime(2026, 11, 21) },
                new Cobro { Id = 2, PolizaId = 1, NumeroCuota = 2, FechaVencimiento = new DateTime(2026, 12, 21) },
                new Cobro { Id = 3, PolizaId = 1, NumeroCuota = 3, FechaVencimiento = new DateTime(2027, 1, 21) }
            }
        };
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1,
            FechaInicio = new DateTime(2026, 7, 21), FechaFin = new DateTime(2027, 7, 21),
            PrecioTotal = 99000, CantidadCuotas = 3
        });

        Assert.Equal(1, polizaRepo.ActualizarLlamadas);
        Assert.Equal(0, polizaRepo.ActualizarConPlanLlamadas);
        Assert.Equal(0, polizaRepo.ModificacionPeriodoLlamadas);
        Assert.Equal(0, cobroRepo.AgregarCicloLlamadas);
        Assert.Equal(new DateTime(2027, 7, 21), polizaRepo.UltimaPolizaActualizada!.FechaFin);
    }

    [Fact]
    public async Task ActualizarAsync_SinCambioPeriodo_NoAgregaCiclo()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza
            {
                Id = 1, Numero = "E/T-1", CompaniaId = 1,
                FechaInicio = new DateTime(2026, 1, 1), FechaFin = new DateTime(2026, 6, 1),
                PrecioTotal = 50000, CantidadCuotas = 6
            }
        };
        var cobroRepo = new FakeCobroRepository();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1,
            FechaInicio = new DateTime(2026, 1, 1), FechaFin = new DateTime(2026, 6, 1),
            PrecioTotal = 50000, CantidadCuotas = 6
        });

        Assert.Equal(0, polizaRepo.ModificacionPeriodoLlamadas);
        Assert.Equal(1, polizaRepo.ActualizarLlamadas);
    }

    [Fact]
    public async Task ActualizarAsync_CambiaPrecioOCuotas_ActualizaPlan()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "E/T-1", CompaniaId = 1, PrecioTotal = 50000, CantidadCuotas = 6 }
        };
        var svc = new PolizaService(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1, FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddMonths(6),
            PrecioTotal = 60000, CantidadCuotas = 3
        });

        Assert.Equal(1, polizaRepo.ActualizarConPlanLlamadas);
        Assert.Equal(0, polizaRepo.ActualizarLlamadas);
        Assert.Equal(60000m, polizaRepo.UltimaPolizaActualizada!.PrecioTotal);
        Assert.Equal(3, polizaRepo.UltimaPolizaActualizada.CantidadCuotas);
    }

    [Fact]
    public async Task ActualizarAsync_CantidadMenorAPagadas_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "E/T-1", CompaniaId = 1, PrecioTotal = 50000, CantidadCuotas = 6 },
            ActualizarConPlanResultado = -1
        };
        var svc = new PolizaService(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await Assert.ThrowsAsync<BusinessException>(() => svc.ActualizarAsync(1, new ActualizarPolizaDto
        {
            CompaniaId = 1, FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddMonths(6),
            PrecioTotal = 60000, CantidadCuotas = 3
        }));

        Assert.Equal(1, polizaRepo.ActualizarConPlanLlamadas);
        Assert.Equal(0, polizaRepo.ActualizarLlamadas);
    }

    [Fact]
    public async Task RefacturarAsync_VigenciaTerminada_BusinessException()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "E/T-1", Estado = EstadoPoliza.Activa, FechaFin = DateTime.Today.AddDays(-1) }
        };
        var cobroRepo = new FakeCobroRepository();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await Assert.ThrowsAsync<BusinessException>(() => svc.RefacturarAsync(1,
            new RenovarPolizaDto { CantidadCuotas = 3, PrecioTotal = 30000, FechaFin = DateTime.Today }));
        Assert.Equal(0, cobroRepo.AgregarCicloLlamadas);
    }

    [Fact]
    public async Task RefacturarAsync_Ok_AgregaCiclo()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "E/T-1", Estado = EstadoPoliza.Activa, FechaFin = DateTime.Today.AddMonths(6) }
        };
        var cobroRepo = new FakeCobroRepository();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await svc.RefacturarAsync(1, new RenovarPolizaDto { CantidadCuotas = 3, PrecioTotal = 30000, PrimerVencimiento = DateTime.Today.AddMonths(1) });

        Assert.Equal(1, cobroRepo.AgregarCicloLlamadas);
    }

    [Fact]
    public async Task EliminarCicloAsync_Ok_EliminaYRegistraAuditoria()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "8223677" }
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { Id = 1, PolizaId = 1, Ciclo = 1, NumeroCuota = 1, FechaVencimiento = new DateTime(2026, 11, 21), Monto = 33000m },
                new Cobro { Id = 2, PolizaId = 1, Ciclo = 2, NumeroCuota = 1, FechaVencimiento = new DateTime(2027, 2, 21), Monto = 33000m, CicloTipo = "ModificacionPeriodo", CicloDescripcion = "Modificación de período" },
                new Cobro { Id = 3, PolizaId = 1, Ciclo = 2, NumeroCuota = 2, FechaVencimiento = new DateTime(2027, 3, 21), Monto = 33000m, CicloTipo = "ModificacionPeriodo" }
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await svc.EliminarCicloAsync(1, 2, usuarioId: 9);

        Assert.Equal(1, polizaRepo.EliminarCicloLlamadas);
        Assert.Equal(1, polizaRepo.UltimaPolizaCicloEliminado);
        Assert.Equal(2, polizaRepo.UltimoCicloEliminado);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("EliminarCiclo", r.accion);
        Assert.Equal("Poliza", r.entidad);
        Assert.Equal(1, r.registroId);
        Assert.Contains("Ciclo 2", r.detalle);
        Assert.Contains("21/02/2027", r.detalle);
        Assert.Contains("Cuotas impagas eliminadas", r.detalle);
    }

    [Fact]
    public async Task EliminarCicloAsync_ConCuotaPagada_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Numero = "P-1" } };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { PolizaId = 1, Ciclo = 1, NumeroCuota = 1, Estado = EstadoCobro.Pagado },
                new Cobro { PolizaId = 1, Ciclo = 2, NumeroCuota = 1, Estado = EstadoCobro.Pagado }
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarCicloAsync(1, 2, 9));

        Assert.Equal(0, polizaRepo.EliminarCicloLlamadas);
        Assert.Empty(auditoria.Registros);
    }

    [Fact]
    public async Task EliminarCicloAsync_CicloOriginal_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Numero = "P-1" } };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { PolizaId = 1, Ciclo = 1, NumeroCuota = 1 },
                new Cobro { PolizaId = 1, Ciclo = 2, NumeroCuota = 1 }
            }
        };
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        var ex = await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarCicloAsync(1, 1, 9));

        Assert.Contains("original", ex.Message);
        Assert.Equal(0, polizaRepo.EliminarCicloLlamadas);
    }

    [Fact]
    public async Task EliminarCicloAsync_ResultadoNegativo_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "P-1" },
            EliminarCicloResultado = -3
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { PolizaId = 1, Ciclo = 1, NumeroCuota = 1 },
                new Cobro { PolizaId = 1, Ciclo = 2, NumeroCuota = 1 }
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(), new FakeRamoRepository(),
            new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await Assert.ThrowsAsync<BusinessException>(() => svc.EliminarCicloAsync(1, 2, 9));

        Assert.Empty(auditoria.Registros);
    }

    [Fact]
    public async Task EditarInicioCuotaAsync_Ok_DesplazaYRegistraAuditoria()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza
            {
                Id = 1, Numero = "P-1", Patente = "AB123CD", Estado = EstadoPoliza.Activa
            }
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { Id = 1, PolizaId = 1, Ciclo = 1, NumeroCuota = 1, FechaVencimiento = new DateTime(2026, 11, 23) },
                new Cobro { Id = 2, PolizaId = 1, Ciclo = 1, NumeroCuota = 2, FechaVencimiento = new DateTime(2026, 12, 23) }
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await svc.EditarInicioCuotaAsync(1, new DateTime(2026, 10, 24), usuarioId: 9);

        Assert.Equal(1, polizaRepo.EditarInicioCuotaLlamadas);
        Assert.Equal(1, polizaRepo.UltimaPolizaInicioCuotaId);
        Assert.Equal(new DateTime(2026, 10, 24), polizaRepo.UltimoInicioCuota);
        Assert.Contains("Inicio de cuota", polizaRepo.UltimaDescripcionInicioCuota);
        Assert.Contains("24/10/2026", polizaRepo.UltimaDescripcionInicioCuota);
        Assert.Contains("24/11/2026", polizaRepo.UltimaDescripcionInicioCuota);

        var r = Assert.Single(auditoria.Registros);
        Assert.Equal("EditarInicioCuota", r.accion);
        Assert.Equal("Poliza", r.entidad);
        Assert.Equal(1, r.registroId);
        Assert.Equal(9, r.usuarioId);
        Assert.Contains("Inicio de cuota", r.detalle);
    }

    [Fact]
    public async Task EditarInicioCuotaAsync_MismaFecha_NoHaceNada()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "P-1", Estado = EstadoPoliza.Activa }
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas =
            {
                new Cobro { Id = 1, PolizaId = 1, Ciclo = 1, NumeroCuota = 1, FechaVencimiento = new DateTime(2026, 11, 23) }
            }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), auditoria);

        await svc.EditarInicioCuotaAsync(1, new DateTime(2026, 10, 23), usuarioId: 9);

        Assert.Equal(0, polizaRepo.EditarInicioCuotaLlamadas);
        Assert.Empty(auditoria.Registros);
    }

    [Fact]
    public async Task EditarInicioCuotaAsync_PolizaNoActiva_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "P-1", Estado = EstadoPoliza.Cancelada }
        };
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas = { new Cobro { Id = 1, PolizaId = 1, Ciclo = 1, NumeroCuota = 1, FechaVencimiento = new DateTime(2026, 11, 23) } }
        };
        var svc = new PolizaService(polizaRepo, cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await Assert.ThrowsAsync<BusinessException>(
            () => svc.EditarInicioCuotaAsync(1, new DateTime(2026, 10, 23), usuarioId: 9));

        Assert.Equal(0, polizaRepo.EditarInicioCuotaLlamadas);
    }

    [Fact]
    public async Task EditarInicioCuotaAsync_SinCuotas_LanzaBusinessException()
    {
        var polizaRepo = new FakePolizaRepository
        {
            PolizaPorId = new Poliza { Id = 1, Numero = "P-1", Estado = EstadoPoliza.Activa }
        };
        var svc = new PolizaService(polizaRepo, new FakeCobroRepository(), new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        await Assert.ThrowsAsync<BusinessException>(
            () => svc.EditarInicioCuotaAsync(1, new DateTime(2026, 10, 23), usuarioId: 9));

        Assert.Equal(0, polizaRepo.EditarInicioCuotaLlamadas);
    }

    [Fact]
    public async Task TieneCuotasImpagasAsync_DetectaImpagas()
    {
        var cobroRepo = new FakeCobroRepository
        {
            Cuotas = { new Cobro { Estado = EstadoCobro.Pagado }, new Cobro { Estado = EstadoCobro.Vencido } }
        };
        var svc = new PolizaService(new FakePolizaRepository(), cobroRepo, new FakeCompaniaRepository(),
            new FakeRamoRepository(), new FakeVehiculoRepository(), new FakePdfService(), new FakeAuditoriaMovimientoService());

        Assert.True(await svc.TieneCuotasImpagasAsync(1));
    }

    [Theory]
    [InlineData(EstadoPoliza.Cancelada)]
    [InlineData(EstadoPoliza.Renovada)]
    public async Task RenovarAsync_EstadoNoRenovable_LanzaBusinessException(EstadoPoliza estado)
    {
        var repo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Estado = estado } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(
            () => service.RenovarAsync(1, NuevaRenovacion()));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task RenovarAsync_PolizaInexistente_LanzaNotFound()
    {
        var repo = new FakePolizaRepository { PolizaPorId = null };
        var service = Crear(repo);

        await Assert.ThrowsAsync<NotFoundException>(
            () => service.RenovarAsync(1, NuevaRenovacion()));
    }

    [Fact]
    public async Task RenovarAsync_PolizaActiva_CreaNuevaYMarcaOrigenRenovada()
    {
        var repo = new FakePolizaRepository { PolizaPorId = new Poliza { Id = 1, Estado = EstadoPoliza.Activa } };
        var service = Crear(repo);

        var result = await service.RenovarAsync(1, NuevaRenovacion());

        Assert.Equal(99, result.NuevaPolizaId);
        Assert.Equal(EstadoPoliza.Renovada, repo.UltimoEstadoCambiado);
    }

    [Fact]
    public async Task CrearAsync_VehiculoConPolizaActiva_LanzaBusinessException()
    {
        var repo = new FakePolizaRepository { PolizaActivaPorVehiculo = new Poliza { Id = 50 } };
        var service = Crear(repo);

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearPolizaDto
        {
            ClienteId = 1, VehiculoId = 1, CompaniaId = 1,
            FechaInicio = DateTime.Today, FechaFin = DateTime.Today.AddYears(1),
            PrecioTotal = 1000, CantidadCuotas = 6
        }));
    }

    private static RenovarPolizaDto NuevaRenovacion() => new()
    {
        FechaInicio = DateTime.Today,
        FechaFin = DateTime.Today.AddYears(1),
        PrecioTotal = 50000,
        CantidadCuotas = 12
    };
}

public class VehiculoServiceTests
{
    [Fact]
    public async Task CrearAsync_PatenteDuplicada_LanzaBusinessException()
    {
        var repo = new FakeVehiculoRepository { PorPatente = new Vehiculo { Id = 1, Patente = "AB123CD" } };
        var service = new VehiculoService(repo);

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearVehiculoDto
        {
            ClienteId = 1, Marca = "Toyota", Modelo = "Corolla", Anio = 2021, Patente = "AB123CD"
        }));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task CrearAsync_PatenteNueva_Inserta()
    {
        var repo = new FakeVehiculoRepository { PorPatente = null };
        var service = new VehiculoService(repo);

        var id = await service.CrearAsync(new CrearVehiculoDto
        {
            ClienteId = 1, Marca = "Toyota", Modelo = "Corolla", Anio = 2021, Patente = "ZZ999ZZ"
        });

        Assert.Equal(7, id);
        Assert.Equal(1, repo.InsertarLlamadas);
    }
}

public class ClienteServiceTests
{
    [Fact]
    public async Task CrearAsync_DocumentoDuplicado_LanzaBusinessException()
    {
        var repo = new FakeClienteRepository { PorDocumento = new Cliente { Id = 1, Documento = "30111222" } };
        var service = new ClienteService(repo, new FakeUsuarioRepository(),
            new FakeVehiculoRepository(), new FakePolizaRepository(), new FakeCompaniaRepository(), new FakePdfService(),
            new FakeAuditoriaMovimientoService(), new FakeNacionalidadRepository());

        await Assert.ThrowsAsync<BusinessException>(() => service.CrearAsync(new CrearClienteDto
        {
            Nombre = "Juan Pérez", Documento = "30111222", NacionalidadId = 1
        }));
        Assert.Equal(0, repo.InsertarLlamadas);
    }

    [Fact]
    public async Task ActualizarAsync_RegistraAuditoriaConDniDelCliente()
    {
        var repo = new FakeClienteRepository
        {
            PorId = new Cliente { Id = 1, Nombre = "Jonathan Rinaldi Rinaldi", Documento = "30111222", TipoDocumento = "DNI" }
        };
        var auditoria = new FakeAuditoriaMovimientoService();
        var service = new ClienteService(repo, new FakeUsuarioRepository(),
            new FakeVehiculoRepository(), new FakePolizaRepository(), new FakeCompaniaRepository(), new FakePdfService(),
            auditoria, new FakeNacionalidadRepository());

        await service.ActualizarAsync(1, new ActualizarClienteDto { Nombre = "Jonathan", NacionalidadId = 1 }, usuarioId: 9);

        var r = Assert.Single(auditoria.Registros);
        Assert.Contains("DNI 30111222", r.detalle);
        Assert.Contains("Nombre", r.detalle);
    }
}
