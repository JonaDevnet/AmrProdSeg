import { useState, type CSSProperties, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import {
  useCliente,
  useVehiculosPorCliente,
  usePolizasPorCliente,
  useActualizarCliente,
  useActualizarDocumento,
  useCrearVehiculo,
  useActualizarVehiculo,
} from "../hooks/clientes";
import { useAuth } from "../auth/AuthContext";
import { useCompanias, useCobrosPorPoliza } from "../hooks/polizas";
import { useRamos, useCoberturas } from "../hooks/admin";
import { actualizarPoliza, asignarNumeroPoliza } from "../api/polizas";
import { Field, Input, Select } from "../components/ui/Field";
import type { Poliza } from "../types";
import type { ActualizarClienteDto } from "../api/clientes";
import type { ClienteFormValues } from "../components/clientes/ClienteForm";
import type { VehiculoFormValues } from "../components/clientes/VehiculoForm";
import ClienteForm from "../components/clientes/ClienteForm";
import DocumentoForm from "../components/clientes/DocumentoForm";
import VehiculoForm from "../components/clientes/VehiculoForm";
import type { Vehiculo } from "../types";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { EstadoPolizaBadge, Plate } from "../components/ui/Badge";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import { descargarDossierCliente } from "../api/clientes";
import { IconArrowLeft, IconEdit, IconCar, IconFile, IconArrowR, IconDownload } from "../components/Icons";
import { formatFecha, formatMoneda } from "../utils/format";
import CopyableValue from "../components/ui/CopyableValue";

export default function ClienteFicha() {
  const { id } = useParams();
  const clienteId = Number(id);
  const navigate = useNavigate();
  const { esAdmin } = useAuth();

  const { data: cliente, isLoading, isError } = useCliente(clienteId);
  const vehiculos = useVehiculosPorCliente(clienteId);
  const polizas = usePolizasPorCliente(clienteId);

  const qc = useQueryClient();
  const companias = useCompanias();
  const actualizar = useActualizarCliente(clienteId);
  const corregirDoc = useActualizarDocumento(clienteId);
  const crearVeh = useCrearVehiculo(clienteId);
  const actualizarVeh = useActualizarVehiculo(clienteId);

  const [editPoliza, setEditPoliza] = useState<Poliza | null>(null);
  const [editar, setEditar] = useState(false);
  const [editarDoc, setEditarDoc] = useState(false);
  const [exportando, setExportando] = useState(false);
  const [formError, setFormError] = useState<string>();
  const [vehModal, setVehModal] = useState<{ vehiculo?: Vehiculo } | null>(null);
  const [vehError, setVehError] = useState<string>();

  const limpioOpc = (s?: string) => (s && s.trim() !== "" ? s.trim() : undefined);

  async function guardarVehiculo(v: VehiculoFormValues) {
    setVehError(undefined);
    try {
      if (vehModal?.vehiculo) {
        await actualizarVeh.mutateAsync({
          id: vehModal.vehiculo.id,
          dto: { marca: v.marca.trim(), modelo: v.modelo.trim(), anio: v.anio, chasis: limpioOpc(v.chasis), motor: limpioOpc(v.motor), combustion: limpioOpc(v.combustion) },
        });
      } else {
        await crearVeh.mutateAsync({
          clienteId, marca: v.marca.trim(), modelo: v.modelo.trim(), anio: v.anio, patente: v.patente.trim(),
          chasis: limpioOpc(v.chasis), motor: limpioOpc(v.motor), combustion: limpioOpc(v.combustion),
        });
      }
      setVehModal(null);
    } catch (e: any) {
      setVehError(e?.response?.data?.error ?? "No se pudo guardar el vehículo.");
    }
  }

  async function handleEditar(v: ClienteFormValues) {
    setFormError(undefined);
    const limpio = (s?: string) => (s && s.trim() !== "" ? s.trim() : undefined);
    const dto: ActualizarClienteDto = {
      nombre: v.nombre.trim(),
      email: limpio(v.email),
      telefono: limpio(v.telefono),
      direccion: limpio(v.direccion),
      fechaNacimiento: limpio(v.fechaNacimiento),
    };
    try {
      await actualizar.mutateAsync(dto);
      setEditar(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.error ?? "No se pudo guardar.");
    }
  }

  async function handleDoc(documento: string) {
    setFormError(undefined);
    try {
      await corregirDoc.mutateAsync(documento);
      setEditarDoc(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.error ?? "No se pudo corregir el documento.");
    }
  }

  async function abrirDossier() {
    setExportando(true);
    try {
      const blob = await descargarDossierCliente(clienteId);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank"); // abre el PDF en el visor; desde ahí se puede descargar
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { /* noop */ } finally { setExportando(false); }
  }

  if (isLoading) return <Cargando />;
  if (isError || !cliente) return <ErrorState mensaje="No se encontró el cliente." />;

  const polizasActivas = polizas.data?.items.filter((p) => p.estado === "Activa") ?? [];
  const polizasHistorial = polizas.data?.items.filter((p) => p.estado !== "Activa") ?? [];

  const renderPolizaCard = (p: (typeof polizasActivas)[number]) => {
    const veh = vehiculos.data?.find((v) => v.id === p.vehiculoId);
    const cia = companias.data?.find((c) => c.id === p.companiaId);
    return (
      <div key={p.id} style={miniCard}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ fontWeight: 600 }}>{p.numero}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <EstadoPolizaBadge estado={p.estado} />
            <button onClick={() => setEditPoliza(p)} title="Editar póliza" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-400)", padding: 0 }}>
              <IconEdit size={19} />
            </button>
          </div>
        </div>
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-500)" }}>
          <IconCar size={13} />
          {veh ? (
            <><span className="mono" style={{ fontWeight: 600, color: "var(--ink-900)", letterSpacing: "0.04em" }}>{veh.patente}</span><span>· {[veh.marca, veh.modelo].filter(Boolean).join(" ")}</span></>
          ) : <span>Sin vehículo asociado</span>}
        </div>
        <VencimientoEstado polizaId={p.id} />
        <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
          <MiniDato k="Compañía" v={cia?.nombre} />
          <MiniDato k="Ramo" v={p.ramoNombre} />
          <MiniDato k="Cobertura" v={p.cobertura ?? veh?.tipoCobertura} />
          <MiniDato k="Prima OG (por cuota)" v={p.primaOG != null ? formatMoneda(p.primaOG) : null} mono />
          <MiniDato k="Precio por cuota" v={formatMoneda(p.precioTotal / Math.max(1, p.cantidadCuotas))} mono />
          <MiniDato k="Período póliza" v={`${nombrePeriodoPoliza(p.fechaInicio, p.fechaFin) ? nombrePeriodoPoliza(p.fechaInicio, p.fechaFin) + " · " : ""}${formatFecha(p.fechaInicio)} – ${formatFecha(p.fechaFin)}`} mono />
          <MiniDato k="Período cuotas" v={planCuotas(p.cantidadCuotas)} />
          <MiniDato k="Forma de pago" v={p.formaPago} />
        </div>
        {p.estado === "Activa" && (
          <button onClick={() => navigate(`/polizas/${p.id}?volverCliente=${clienteId}`)} style={pagarBtn}>
            Pagar cuota <IconArrowR size={15} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div>
      <button onClick={() => navigate("/")} style={backBtn}>
        <IconArrowLeft size={16} /> Volver a la cartera
      </button>

      {/* Encabezado / datos del cliente */}
      <div style={card}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", margin: "0 0 4px" }}>
              {cliente.nombre}
            </h1>
            <div style={{ color: "var(--ink-500)", fontSize: 14 }}>
              <CopyableValue value={`${cliente.tipoDocumento ? cliente.tipoDocumento + " " : ""}${cliente.documento}`} mono align="start" />
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <Button variant="secondary" onClick={abrirDossier} disabled={exportando}>
              <IconDownload size={16} /> {exportando ? "Generando…" : "Exportar PDF"}
            </Button>
            {esAdmin && (
              <Button variant="secondary" onClick={() => { setFormError(undefined); setEditarDoc(true); }}>
                Corregir documento
              </Button>
            )}
            <Button variant="secondary" onClick={() => { setFormError(undefined); setEditar(true); }}>
              <IconEdit size={16} /> Editar
            </Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginTop: 22 }}>
          <Dato label="Email" valor={cliente.email} />
          <Dato label="Teléfono" valor={cliente.telefono} />
          <Dato label="Dirección" valor={cliente.direccion} />
          <Dato label="Nacimiento" valor={cliente.fechaNacimiento ? formatFecha(cliente.fechaNacimiento) : null} />
          <Dato label="Alta" valor={formatFecha(cliente.fechaAlta)} />
        </div>
      </div>

      {/* Vehículos */}
      <Seccion
        titulo="Vehículos"
        icono={<IconCar size={18} />}
      >
        {vehiculos.isLoading ? (
          <Cargando />
        ) : vehiculos.isError ? (
          <ErrorState />
        ) : !vehiculos.data || vehiculos.data.length === 0 ? (
          <VacioState mensaje="Sin vehículos asociados." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {vehiculos.data.map((v) => (
              <div key={v.id} style={miniCard}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div style={{ fontWeight: 600 }}>{v.marca} {v.modelo} <span style={{ color: "var(--ink-400)", fontWeight: 400 }}>· {v.anio}</span></div>
                  <button onClick={() => { setVehError(undefined); setVehModal({ vehiculo: v }); }} title="Editar" style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-400)", padding: 0 }}>
                    <IconEdit size={19} />
                  </button>
                </div>
                <div style={{ marginTop: 6 }}><PlateCopiable patente={v.patente} /></div>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 2 }}>
                  <MiniDato k="Marca" v={v.marca} />
                  <MiniDato k="Modelo" v={v.modelo} />
                  <MiniDato k="Año" v={v.anio ? String(v.anio) : null} mono />
                  <MiniDato k="Combustión" v={v.combustion} />
                  <MiniDato k="N° chasis" v={v.chasis} mono />
                  <MiniDato k="N° motor" v={v.motor} mono />
                </div>
              </div>
            ))}
          </div>
        )}
      </Seccion>

      {/* Pólizas activas */}
      <Seccion titulo="Pólizas" icono={<IconFile size={18} />}>
        {polizas.isLoading ? (
          <Cargando />
        ) : polizas.isError ? (
          <ErrorState />
        ) : polizasActivas.length === 0 ? (
          <VacioState mensaje="Sin pólizas activas." />
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {polizasActivas.map(renderPolizaCard)}
          </div>
        )}
      </Seccion>

      {/* Historial: pólizas vencidas, renovadas o canceladas */}
      {polizasHistorial.length > 0 && (
        <Seccion titulo="Historial de pólizas" icono={<IconFile size={18} />}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
            {polizasHistorial.map(renderPolizaCard)}
          </div>
        </Seccion>
      )}

      {editar && (
        <Modal titulo="Editar cliente" onClose={() => setEditar(false)}>
          {formError && <Banner mensaje={formError} />}
          <ClienteForm cliente={cliente} onSubmit={handleEditar} enviando={actualizar.isPending} />
        </Modal>
      )}

      {editarDoc && (
        <Modal titulo="Corregir documento" onClose={() => setEditarDoc(false)}>
          {formError && <Banner mensaje={formError} />}
          <DocumentoForm documentoActual={cliente.documento} onSubmit={handleDoc} enviando={corregirDoc.isPending} />
        </Modal>
      )}

      {editPoliza && (
        <PolizaEditModal
          poliza={editPoliza}
          vehiculo={vehiculos.data?.find((v) => v.id === editPoliza.vehiculoId) ?? null}
          onClose={() => setEditPoliza(null)}
          onSaved={() => {
            setEditPoliza(null);
            polizas.refetch();
            vehiculos.refetch();
            // Invalidar también el detalle de póliza y la lista global: si no, la vista de
            // Cobranzas/Detalle queda con la vigencia/datos viejos cacheados (["poliza", id]).
            qc.invalidateQueries({ queryKey: ["poliza"] });
            qc.invalidateQueries({ queryKey: ["polizas"] });
            qc.invalidateQueries({ queryKey: ["cobros"] });
          }}
        />
      )}

      {vehModal && (
        <Modal titulo={vehModal.vehiculo ? "Editar vehículo" : "Agregar vehículo"} onClose={() => setVehModal(null)} ancho={520}>
          {vehError && <Banner mensaje={vehError} />}
          <VehiculoForm vehiculo={vehModal.vehiculo} onSubmit={guardarVehiculo} enviando={crearVeh.isPending || actualizarVeh.isPending} />
        </Modal>
      )}
    </div>
  );
}

function Dato({ label, valor }: { label: string; valor?: string | null }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 14.5, color: "var(--ink-900)" }}><CopyableValue value={valor} align="start" /></div>
    </div>
  );
}

function MiniDato({ k, v, mono }: { k: string; v?: string | null; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, fontSize: 12.5 }}>
      <span style={{ color: "var(--ink-500)" }}>{k}</span>
      <CopyableValue value={v} mono={mono} />
    </div>
  );
}

// Vencimiento de la CUOTA ACTUAL (la última pagada; si ninguna, la 1ª) + estado según cobranza.
function VencimientoEstado({ polizaId }: { polizaId: number }) {
  const cobros = useCobrosPorPoliza(polizaId);
  const cuotas = cobros.data ?? [];
  const ordenadas = [...cuotas].sort((a, b) => a.numeroCuota - b.numeroCuota);
  // Cuota actual = la última PAGADA (estado=1); si no hay ninguna pagada, la 1ª cuota.
  const pagadas = ordenadas.filter((c) => c.estado === 1);
  const actual = pagadas.length ? pagadas[pagadas.length - 1] : ordenadas[0];
  // El estado (al día / por vencer / vencida) se calcula sobre la próxima cuota IMPAGA,
  // así el badge sigue avisando si el cliente se atrasa aunque se muestre la cuota actual.
  const prox = ordenadas
    .filter((c) => c.estado !== 1)
    .sort((a, b) => new Date(a.fechaVencimiento).getTime() - new Date(b.fechaVencimiento).getTime())[0];

  let key: "vigente" | "porvencer" | "vencida" | "aldia" = "aldia";
  if (prox) {
    const dias = Math.ceil((new Date(prox.fechaVencimiento).getTime() - Date.now()) / 86_400_000);
    key = dias < 0 ? "vencida" : dias <= 10 ? "porvencer" : "vigente";
  }
  const cfg = {
    vigente:   { label: "Vigente",    bg: "var(--ok-100)",   fg: "var(--ok-700)" },
    porvencer: { label: "Por vencer", bg: "var(--warn-100)", fg: "var(--warn-700)" },
    vencida:   { label: "Vencida",    bg: "var(--bad-100)",  fg: "var(--bad-700)" },
    aldia:     { label: "Al día",     bg: "var(--ok-100)",   fg: "var(--ok-700)" },
  }[key];

  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "8px 10px", borderRadius: 8, background: "var(--canvas)", border: "1px solid var(--line-2)" }}>
      <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.25 }}>
        <span style={{ fontSize: 10.5, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Vencimiento{actual ? ` · cuota ${actual.numeroCuota}/${cuotas.length}` : ""}
        </span>
        <span className="mono" style={{ fontSize: 13.5, fontWeight: 600, color: "var(--ink-900)" }}>
          {cobros.isLoading ? "…" : actual ? formatFecha(actual.fechaVencimiento) : "—"}
        </span>
      </div>
      {cobros.isLoading
        ? <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: "var(--line-2)", color: "var(--ink-500)" }}>…</span>
        : <span style={{ padding: "3px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: cfg.bg, color: cfg.fg, whiteSpace: "nowrap" }}>{cfg.label}</span>}
    </div>
  );
}

// Placa de patente que se copia al portapapeles al hacer clic.
function PlateCopiable({ patente }: { patente: string }) {
  const [copied, setCopied] = useState(false);
  async function copiar() {
    if (!patente) return;
    try {
      await navigator.clipboard.writeText(patente);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = patente; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }
  return (
    <button onClick={copiar} title={copied ? "¡Copiado!" : "Copiar patente"}
      style={{ border: 0, background: "transparent", padding: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Plate patente={patente} />
      <span style={{ fontSize: 11.5, fontWeight: 500, color: copied ? "var(--ok-700)" : "var(--ink-400)" }}>
        {copied ? "✓ copiado" : "copiar"}
      </span>
    </button>
  );
}

function Seccion({ titulo, icono, accion, children }: { titulo: string; icono: ReactNode; accion?: ReactNode; children: ReactNode }) {
  return (
    <div style={{ marginTop: 22 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--ink-700)" }}>
        {icono}
        <h2 style={{ fontSize: 16, fontWeight: 600, margin: 0 }}>{titulo}</h2>
        {accion && <div style={{ marginLeft: "auto" }}>{accion}</div>}
      </div>
      <div style={{ ...card, padding: 16 }}>{children}</div>
    </div>
  );
}

function Banner({ mensaje }: { mensaje: string }) {
  return (
    <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
      {mensaje}
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
  marginTop: 14,
  marginBottom: 16,
  padding: 0,
};
const card: CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: "var(--r-lg)",
  padding: 24,
};
const miniCard: CSSProperties = {
  background: "var(--canvas)",
  border: "1px solid var(--line-2)",
  borderRadius: 10,
  padding: 14,
};
const pagarBtn: CSSProperties = {
  marginTop: 12, width: "100%", height: 38, border: 0, borderRadius: 9,
  background: "var(--navy-900)", color: "white", cursor: "pointer",
  fontSize: 13.5, fontWeight: 600,
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
};

// Plan de cuotas según la cantidad (Mensual=1, Bimestral=2, Trimestral=3).
function planCuotas(n: number): string {
  const plan = ["", "Mensual", "Bimestral", "Trimestral"][n];
  return plan ? `${plan} (${n})` : `${n} cuotas`;
}

const PLAN_CUOTAS: Record<string, number> = { Mensual: 1, Bimestral: 2, Trimestral: 3 };

// Período de vigencia de la póliza, en meses.
const PERIODO_POLIZA: Record<string, number> = { Mensual: 1, Bimestral: 2, Trimestral: 3, Cuatrimestral: 4, Semestral: 6, Anual: 12 };

function sumarMeses(iso: string, meses: number): string {
  const d = new Date(iso + "T00:00:00Z");
  d.setUTCMonth(d.getUTCMonth() + meses);
  return d.toISOString().slice(0, 10);
}

function mesesEntre(desde: string, hasta: string): number {
  const a = new Date(desde + "T00:00:00Z"), b = new Date(hasta + "T00:00:00Z");
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return m;
}

// Nombre del período según el rango de fechas (ej. "Semestral"); vacío si no encaja.
function nombrePeriodoPoliza(desde: string, hasta: string): string {
  const m = mesesEntre(desde.slice(0, 10), hasta.slice(0, 10));
  return Object.entries(PERIODO_POLIZA).find(([, n]) => n === m)?.[0] ?? "";
}

function PolizaEditModal({ poliza, vehiculo, onClose, onSaved }: { poliza: Poliza; vehiculo: Vehiculo | null; onClose: () => void; onSaved: () => void }) {
  const companias = useCompanias();
  const ramos = useRamos();
  const coberturas = useCoberturas();
  const [numero, setNumero] = useState(poliza.numero);
  const [companiaId, setCompaniaId] = useState(String(poliza.companiaId));
  const [ramoId, setRamoId] = useState(poliza.ramoId ? String(poliza.ramoId) : "");
  const [cobertura, setCobertura] = useState(poliza.cobertura ?? vehiculo?.tipoCobertura ?? "");
  const [fechaInicio, setFechaInicio] = useState(poliza.fechaInicio.slice(0, 10));
  const [fechaFin, setFechaFin] = useState(poliza.fechaFin.slice(0, 10));
  const [precioCuota, setPrecioCuota] = useState(String(Math.round((poliza.precioTotal / Math.max(1, poliza.cantidadCuotas)) * 100) / 100));
  const [cantidadCuotas, setCantidadCuotas] = useState(String(poliza.cantidadCuotas));
  const [primaOG, setPrimaOG] = useState(poliza.primaOG != null ? String(poliza.primaOG) : "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string>();

  // Modelo "Inicio de póliza": la 1ª cuota vence 1 mes después del inicio y las
  // siguientes +1 mes cada una. Se DERIVA del inicio (no se edita a mano).
  const primeraCuota = sumarMeses(fechaInicio, 1);

  // "Período de cuotas" ↔ cantidad: Mensual=1, Bimestral=2, Trimestral=3.
  const periodoCuotas = Object.entries(PLAN_CUOTAS).find(([, n]) => n === Number(cantidadCuotas))?.[0] ?? "";
  // "Período de póliza" ↔ meses entre inicio y fin (Mensual=1 … Anual=12).
  const periodoPoliza = nombrePeriodoPoliza(fechaInicio, fechaFin);

  async function guardar() {
    setError(undefined); setGuardando(true);
    try {
      await actualizarPoliza(poliza.id, {
        companiaId: Number(companiaId), ramoId: ramoId ? Number(ramoId) : undefined,
        fechaInicio, fechaFin, precioTotal: Math.round(Number(precioCuota) * Number(cantidadCuotas) * 100) / 100, cantidadCuotas: Number(cantidadCuotas),
        primaOG: primaOG.trim() ? Number(primaOG.replace(/[^\d.]/g, "")) : undefined,
        cobertura: cobertura || undefined,
        primerVencimiento: primeraCuota,
      });
      // El número se cambia por su endpoint propio (valida que no esté en uso por una póliza viva).
      if (numero.trim() && numero.trim() !== poliza.numero) {
        await asignarNumeroPoliza(poliza.id, numero.trim());
      }
      onSaved();
    } catch (e: any) { setError(e?.response?.data?.error ?? "No se pudo guardar."); } finally { setGuardando(false); }
  }

  return (
    <Modal titulo={`Editar póliza ${poliza.numero}`} onClose={onClose}>
      {error && <Banner mensaje={error} />}
      <Field label="Número de póliza">
        <Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="Número de póliza" />
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Compañía"><Select value={companiaId} onChange={(e) => setCompaniaId(e.target.value)}>{companias.data?.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}</Select></Field>
        <Field label="Ramo"><Select value={ramoId} onChange={(e) => setRamoId(e.target.value)}><option value="">—</option>{ramos.data?.map((r) => <option key={r.id} value={r.id}>{r.nombre}</option>)}</Select></Field>
      </div>
      <Field label="Tipo de cobertura">
        <Select value={cobertura} onChange={(e) => setCobertura(e.target.value)}>
          <option value="">—</option>
          {coberturas.data?.map((c) => <option key={c.id} value={c.nombre}>{c.nombre}</option>)}
        </Select>
      </Field>
      <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-500)", margin: "6px 0 2px" }}>Período de póliza (vigencia)</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <Field label="Período">
          <Select value={periodoPoliza} onChange={(e) => setFechaFin(sumarMeses(fechaInicio, PERIODO_POLIZA[e.target.value] ?? 12))}>
            {periodoPoliza === "" && <option value="">Personalizado</option>}
            {Object.keys(PERIODO_POLIZA).map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Fecha inicio"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></Field>
        <Field label="Fecha fin"><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Período de cuotas">
          <Select value={periodoCuotas} onChange={(e) => setCantidadCuotas(String(PLAN_CUOTAS[e.target.value] ?? cantidadCuotas))}>
            {periodoCuotas === "" && <option value="">{cantidadCuotas} cuotas</option>}
            {Object.keys(PLAN_CUOTAS).map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
        <Field label="Cantidad de cuotas"><Input type="number" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Precio por cuota"><Input type="number" step="0.01" value={precioCuota} onChange={(e) => setPrecioCuota(e.target.value)} /></Field>
        <Field label="Prima OG (por cuota, interna)"><Input type="number" step="0.01" value={primaOG} onChange={(e) => setPrimaOG(e.target.value)} placeholder="Prima real de la compañía" /></Field>
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 6 }}>
        Las cuotas se generan desde el <strong>inicio de póliza</strong> (arriba): la 1ª vence el{" "}
        <strong>{primeraCuota.split("-").reverse().join("/")}</strong> (inicio + 1 mes) y las siguientes +1 mes cada una.
        Al cambiar el inicio se re-fechan <strong>todas</strong> las cuotas; en las pagadas solo cambia la fecha de vencimiento (no el cobro).
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
        Total de la póliza: <strong>{formatMoneda((Number(precioCuota) || 0) * (Number(cantidadCuotas) || 0))}</strong> ({cantidadCuotas} cuotas)
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </Modal>
  );
}
