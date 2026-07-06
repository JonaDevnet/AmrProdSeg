import { useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { usePoliza, useCobrosPorPoliza, useCompanias, useCancelarPoliza, useRenovarPoliza, useEndosarTitular, useEndosos } from "../hooks/polizas";
import { useCliente, useVehiculosPorCliente } from "../hooks/clientes";
import { descargarPolizaPdf, type RenovarPolizaDto, type EndosoTitularDto } from "../api/polizas";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import PagoModal from "../components/cobranzas/PagoModal";
import ComprobanteModal, { type ComprobanteData } from "../components/cobranzas/ComprobanteModal";
import RenovarForm from "../components/cobranzas/RenovarForm";
import EndosoForm from "../components/polizas/EndosoForm";
import { EstadoPolizaBadge, EstadoCobroBadge, Plate } from "../components/ui/Badge";
import { companiaColor } from "../utils/companiaColor";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import { IconArrowLeft, IconDownload, IconBan } from "../components/Icons";
import { formatFecha, formatMoneda } from "../utils/format";
import { useAuth } from "../auth/AuthContext";
import type { Cobro } from "../types";

export default function PolizaDetalle() {
  const { id } = useParams();
  const polizaId = Number(id);
  const navigate = useNavigate();
  const { esAdmin } = useAuth();

  const { data: poliza, isLoading, isError } = usePoliza(polizaId);
  const cobros = useCobrosPorPoliza(polizaId);
  const companias = useCompanias();
  const cliente = useCliente(poliza?.clienteId ?? 0);
  const vehiculos = useVehiculosPorCliente(poliza?.clienteId ?? 0);
  const cancelar = useCancelarPoliza(polizaId);
  const renovar = useRenovarPoliza(polizaId);
  const endosar = useEndosarTitular(polizaId);
  const endosos = useEndosos(polizaId);

  const [confirmar, setConfirmar] = useState(false);
  const [bajando, setBajando] = useState(false);
  const [accionError, setAccionError] = useState<string>();
  const [cuotaPago, setCuotaPago] = useState<Cobro | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null);
  const [renovarOpen, setRenovarOpen] = useState(false);
  const [endosoOpen, setEndosoOpen] = useState(false);

  if (isLoading) return <Cargando />;
  if (isError || !poliza) return <ErrorState mensaje="No se encontró la póliza." />;

  const compania = companias.data?.find((c) => c.id === poliza.companiaId);
  const vehiculo = vehiculos.data?.find((v) => v.id === poliza.vehiculoId);

  async function bajarPdf() {
    setAccionError(undefined);
    setBajando(true);
    try {
      const blob = await descargarPolizaPdf(poliza!.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${poliza!.numero}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setAccionError("No se pudo generar el PDF.");
    } finally {
      setBajando(false);
    }
  }

  async function confirmarCancelacion() {
    setAccionError(undefined);
    try {
      await cancelar.mutateAsync();
      setConfirmar(false);
    } catch (e: any) {
      setAccionError(e?.response?.data?.error ?? "No se pudo cancelar la póliza.");
    }
  }

  async function confirmarRenovacion(dto: RenovarPolizaDto) {
    setAccionError(undefined);
    try {
      const res = await renovar.mutateAsync(dto);
      setRenovarOpen(false);
      navigate(`/polizas/${res.nuevaPolizaId}`);
    } catch (e: any) {
      setAccionError(e?.response?.data?.error ?? "No se pudo renovar la póliza.");
    }
  }

  async function confirmarEndoso(dto: EndosoTitularDto) {
    setAccionError(undefined);
    try {
      await endosar.mutateAsync(dto);
      setEndosoOpen(false);
    } catch (e: any) {
      setAccionError(e?.response?.data?.error ?? "No se pudo realizar el endoso.");
    }
  }

  const cuotas = cobros.data ?? [];
  const pagadas = cuotas.filter((c) => c.estado === 1).length;
  const renovable = poliza.estado === "Activa" || poliza.estado === "Vencida";

  return (
    <div>
      <button onClick={() => navigate("/polizas")} style={backBtn}>
        <IconArrowLeft size={16} /> Volver a pólizas
      </button>

      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 className="mono" style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.01em", margin: 0 }}>
                {poliza.numero}
              </h1>
              <EstadoPolizaBadge estado={poliza.estado} />
            </div>
            <div style={{ color: "var(--ink-500)", fontSize: 14, marginTop: 6 }}>
              Emitida el {formatFecha(poliza.fechaEmision)}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <Button variant="secondary" onClick={bajarPdf} disabled={bajando}>
              <IconDownload size={16} /> {bajando ? "Generando…" : "Comprobante PDF"}
            </Button>
            {renovable && (
              <Button onClick={() => { setAccionError(undefined); setRenovarOpen(true); }}>
                Renovar
              </Button>
            )}
            {renovable && (
              <Button variant="secondary" onClick={() => { setAccionError(undefined); setEndosoOpen(true); }}>
                Endoso
              </Button>
            )}
            {poliza.estado === "Activa" && (
              <Button variant="danger" onClick={() => { setAccionError(undefined); setConfirmar(true); }}>
                <IconBan size={16} /> Cancelar
              </Button>
            )}
          </div>
        </div>

        {accionError && (
          <div style={{ marginTop: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
            {accionError}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginTop: 22 }}>
          <Dato label="Cliente">
            {cliente.data ? (
              <Link to={`/clientes/${cliente.data.id}`} style={{ color: "var(--blue-600)", textDecoration: "none", fontWeight: 500 }}>
                {cliente.data.nombre}
              </Link>
            ) : "—"}
          </Dato>
          <Dato label="Vehículo">
            {vehiculo ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                {vehiculo.marca} {vehiculo.modelo} <Plate patente={vehiculo.patente} />
              </span>
            ) : "—"}
          </Dato>
          <Dato label="Compañía">
            {compania ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: companiaColor(poliza.companiaId), flexShrink: 0 }} />
                {compania.nombre}
              </span>
            ) : "—"}
          </Dato>
          <Dato label="Vigencia">{formatFecha(poliza.fechaInicio)} – {formatFecha(poliza.fechaFin)}</Dato>
          <Dato label="Prima total">{formatMoneda(poliza.precioTotal)}</Dato>
          <Dato label="Cuotas">{poliza.cantidadCuotas}</Dato>
          {/* <Dato label="Cliente de">{poliza.clienteVendedorNombre ?? "—"}</Dato> */}
          {esAdmin && <Dato label="Cargada por">{poliza.vendedorNombre ?? "—"}</Dato>}
        </div>
      </div>

      {/* Cuotas */}
      <div style={{ marginTop: 22 }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>Plan de cuotas</h2>
          {cuotas.length > 0 && (
            <span style={{ fontSize: 13, color: "var(--ink-500)" }}>
              {pagadas} de {cuotas.length} pagadas
            </span>
          )}
        </div>
        <div style={{ ...card, padding: 0, overflow: "hidden" }}>
          {cobros.isLoading ? (
            <Cargando />
          ) : cobros.isError ? (
            <ErrorState />
          ) : cuotas.length === 0 ? (
            <VacioState mensaje="Esta póliza no tiene cuotas." />
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Cuota</th>
                  <th style={th}>Vencimiento</th>
                  <th style={th}>Monto</th>
                  <th style={th}>Estado</th>
                  <th style={th}>Pago</th>
                  {esAdmin && <th style={th}>Cobró</th>}
                  <th style={{ ...th, textAlign: "right" }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {cuotas.map((c) => (
                  <tr key={c.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ ...td, fontWeight: 600 }}>#{c.numeroCuota}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(c.fechaVencimiento)}</td>
                    <td style={td}>{formatMoneda(c.monto)}</td>
                    <td style={td}><EstadoCobroBadge estado={c.estado} /></td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(c.fechaPago)}</td>
                    {esAdmin && <td style={{ ...td, color: "var(--ink-500)" }}>{c.estado === 1 ? (c.cobradorNombre ?? "—") : "—"}</td>}
                    <td style={{ ...td, textAlign: "right" }}>
                      {c.estado !== 1 && (
                        <Button onClick={() => setCuotaPago(c)} style={{ height: 32, padding: "0 12px", fontSize: 13 }}>
                          Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {(endosos.data?.length ?? 0) > 0 && (
        <div style={{ marginTop: 22 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, margin: "0 0 12px" }}>Titulares anteriores</h2>
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={th}>Fecha</th>
                  <th style={th}>Titular anterior</th>
                  <th style={th}>Nuevo titular</th>
                  <th style={th}>Motivo</th>
                  {esAdmin && <th style={th}>Usuario</th>}
                </tr>
              </thead>
              <tbody>
                {endosos.data!.map((e) => (
                  <tr key={e.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(e.fechaEndoso)}</td>
                    <td style={td}>{e.clienteAnteriorNombre}{e.clienteAnteriorDocumento ? ` · ${e.clienteAnteriorDocumento}` : ""}</td>
                    <td style={td}>{e.clienteNuevoNombre}{e.clienteNuevoDocumento ? ` · ${e.clienteNuevoDocumento}` : ""}</td>
                    <td style={{ ...td, color: "var(--ink-500)" }}>{e.motivo ?? "—"}</td>
                    {esAdmin && <td style={{ ...td, color: "var(--ink-500)" }}>{e.usuarioNombre ?? "—"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {cuotaPago && (
        <PagoModal
          cuota={cuotaPago}
          tituloContexto={poliza.numero}
          onClose={() => setCuotaPago(null)}
          onPagado={() => {
            // Cuponera: sólo se marca el pago, sin comprobante.
            if (poliza.formaPago !== "Cuponera") {
              setComprobante({
                cobroId: cuotaPago.id,
                cuotaN: cuotaPago.numeroCuota,
                monto: cuotaPago.monto,
                fecha: formatFecha(new Date().toISOString()),
                cliente: cliente.data?.nombre ?? "—",
                poliza: poliza.numero,
                compania: compania?.nombre ?? "—",
                ramo: poliza.ramoNombre ?? "—",
              });
            }
            setCuotaPago(null);
          }}
        />
      )}
      {comprobante && <ComprobanteModal c={comprobante} onClose={() => setComprobante(null)} />}

      {renovarOpen && companias.data && (
        <Modal titulo="Renovar póliza" onClose={() => setRenovarOpen(false)} ancho={520}>
          {accionError && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
              {accionError}
            </div>
          )}
          <RenovarForm
            poliza={poliza}
            companias={companias.data}
            onSubmit={confirmarRenovacion}
            enviando={renovar.isPending}
          />
        </Modal>
      )}

      {endosoOpen && (
        <Modal titulo="Endoso · cambio de titular" onClose={() => setEndosoOpen(false)} ancho={560}>
          {accionError && (
            <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
              {accionError}
            </div>
          )}
          <EndosoForm onSubmit={confirmarEndoso} enviando={endosar.isPending} />
        </Modal>
      )}

      {confirmar && (
        <Modal titulo="Cancelar póliza" onClose={() => setConfirmar(false)} ancho={420}>
          <p style={{ marginTop: 0, fontSize: 14, color: "var(--ink-700)" }}>
            ¿Confirmás la cancelación de la póliza <strong className="mono">{poliza.numero}</strong>? Esta acción no se puede deshacer.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setConfirmar(false)}>Volver</Button>
            <Button variant="danger" onClick={confirmarCancelacion} disabled={cancelar.isPending}>
              {cancelar.isPending ? "Cancelando…" : "Sí, cancelar"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Dato({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14.5, color: "var(--ink-900)" }}>{children}</div>
    </div>
  );
}

const backBtn: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  border: 0,
  background: "transparent",
  color: "var(--ink-500)",
  cursor: "pointer",
  fontSize: 13.5,
  marginBottom: 16,
  padding: 0,
};
const card: CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-lg)",
  padding: 24,
};
const th: CSSProperties = {
  textAlign: "left",
  padding: "12px 16px",
  fontSize: 12,
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.04em",
  color: "var(--ink-400)",
  background: "var(--canvas)",
};
const td: CSSProperties = { padding: "13px 16px", fontSize: 14 };
