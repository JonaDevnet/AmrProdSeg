// Ficha del asegurado: muestra cliente + vehículo + póliza en tablas ordenadas.
// No incluye cuotas/pagos (eso se gestiona en Cobranzas).
import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactNode } from "react";
import { usePoliza } from "../hooks/polizas";
import { getCliente } from "../api/clientes";
import { getVehiculosPorCliente } from "../api/vehiculos";
import { formatFecha, formatMoneda } from "../utils/format";
import { IconClose } from "../design/icons";
import CopyableValue from "./ui/CopyableValue";

const ESTADO_LABEL: Record<string, string> = {
  Activa: "Activa", Vencida: "Vencida", Cancelada: "Cancelada", Renovada: "Renovada",
};

export default function FichaModal({ polizaId, onClose }: { polizaId: number; onClose: () => void }) {
  const { data: poliza, isLoading } = usePoliza(polizaId);

  const cliente = useQuery({
    queryKey: ["cliente", poliza?.clienteId],
    queryFn: () => getCliente(poliza!.clienteId),
    enabled: !!poliza?.clienteId,
  });

  const vehiculos = useQuery({
    queryKey: ["vehiculos", poliza?.clienteId],
    queryFn: () => getVehiculosPorCliente(poliza!.clienteId),
    enabled: !!poliza?.clienteId,
  });
  const listaVeh = vehiculos.data ?? [];

  return (
    <div onClick={onClose} style={back}>
      <div onClick={(e) => e.stopPropagation()} style={modal}>
        {/* Header */}
        <div style={head}>
          <div>
            <div style={kicker}>Ficha del asegurado</div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{cliente.data?.nombre ?? "—"}</div>
            <div style={{ fontSize: 12.5, color: "oklch(0.78 0.04 240)", marginTop: 4, display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span className="mono">{poliza?.numero ?? "—"}</span>
              {poliza?.ramoNombre && <><span style={{ opacity: 0.5 }}>·</span>{poliza.ramoNombre}</>}
            </div>
          </div>
          <button onClick={onClose} style={closeBtn}><IconClose size={16} /></button>
        </div>

        {/* Body */}
        <div style={body}>
          {isLoading ? (
            <div style={{ padding: 30, textAlign: "center", color: "var(--ink-500)" }}>Cargando…</div>
          ) : (
            <>
              <Seccion titulo="Datos del asegurado">
                <Tabla filas={[
                  ["Nombre completo", cliente.data?.nombre],
                  ["Tipo de documento", cliente.data?.tipoDocumento],
                  ["Documento", cliente.data?.documento, true],
                  ["Email", cliente.data?.email],
                  ["Teléfono", cliente.data?.telefono, true],
                  ["Domicilio", cliente.data?.direccion],
                  ["Alta", cliente.data ? formatFecha(cliente.data.fechaAlta) : null, true],
                ]} />
              </Seccion>

              {listaVeh.map((v, idx) => (
                <Seccion key={v.id} titulo={listaVeh.length > 1 ? `Datos del vehículo ${idx + 1}` : "Datos del vehículo"}>
                  <Tabla filas={[
                    ["Patente", v.patente, true],
                    ["Marca", v.marca],
                    ["Modelo", v.modelo],
                    ["Año", v.anio ? String(v.anio) : null, true],
                    ["Combustión", v.combustion],
                    ["N° de chasis", v.chasis, true],
                    ["N° de motor", v.motor, true],
                    ["Cobertura", v.tipoCobertura],
                  ]} />
                </Seccion>
              ))}

              <Seccion titulo="Datos de la póliza">
                <Tabla filas={[
                  ["Número", poliza?.numero, true],
                  ["Estado", poliza ? ESTADO_LABEL[poliza.estado] ?? poliza.estado : null],
                  ["Ramo", poliza?.ramoNombre],
                  ["Cobertura", poliza?.cobertura],
                  ["Vigencia", poliza ? `${formatFecha(poliza.fechaInicio)} – ${formatFecha(poliza.fechaFin)}` : null, true],
                  ["Precio total", poliza ? formatMoneda(poliza.precioTotal) : null, true],
                  ["Cuotas", poliza ? String(poliza.cantidadCuotas) : null, true],
                  ["Forma de pago", poliza?.formaPago],
                  ["Prima OG (interna)", poliza?.primaOG != null ? formatMoneda(poliza.primaOG) : null, true],
                ]} />
              </Seccion>
            </>
          )}
        </div>

        <div style={foot}>
          <button onClick={onClose} style={cerrarBtn}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--blue-600)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 8 }}>{titulo}</div>
      {children}
    </div>
  );
}

function Tabla({ filas }: { filas: [string, string | number | null | undefined, boolean?][] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13.5 }}>
      <tbody>
        {filas.map(([label, valor, mono], i) => (
          <tr key={i} style={{ borderBottom: i < filas.length - 1 ? "1px solid var(--line-2)" : 0 }}>
            <td style={tdLabel}>{label}</td>
            <td style={tdValue}>
              <CopyableValue value={valor} mono={mono} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const back: CSSProperties = { position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(5px)", zIndex: 60, display: "grid", placeItems: "center", padding: 24 };
const modal: CSSProperties = { width: 640, maxWidth: "100%", maxHeight: "calc(100vh - 48px)", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden", display: "flex", flexDirection: "column" };
const head: CSSProperties = { padding: "20px 24px", background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexShrink: 0 };
const kicker: CSSProperties = { fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 };
const closeBtn: CSSProperties = { width: 36, height: 36, borderRadius: 9, border: "1px solid oklch(1 0 0 / 0.15)", background: "oklch(1 0 0 / 0.08)", color: "oklch(0.85 0.04 240)", cursor: "pointer", display: "grid", placeItems: "center", flexShrink: 0 };
const body: CSSProperties = { padding: "20px 24px", overflowY: "auto" };
const tdLabel: CSSProperties = { padding: "9px 0", color: "var(--ink-500)", width: 160, verticalAlign: "top", fontSize: 12.5 };
const tdValue: CSSProperties = { padding: "9px 0", fontWeight: 500, textAlign: "right", overflowWrap: "anywhere" };
const foot: CSSProperties = { padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", flexShrink: 0 };
const cerrarBtn: CSSProperties = { height: 38, padding: "0 18px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" };
