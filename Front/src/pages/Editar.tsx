import { useState, type CSSProperties } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { listarClientes, actualizarCliente } from "../api/clientes";
import { getVehiculoPorPatente, actualizarVehiculo } from "../api/vehiculos";
import { useQueryClient } from "@tanstack/react-query";
import { getPoliza, actualizarPoliza } from "../api/polizas";
import { buscarGlobal } from "../api/search";
import { useCompanias } from "../hooks/polizas";
import { useVehiculosPorCliente } from "../hooks/clientes";
import { useRamos, useCoberturas } from "../hooks/admin";
import ClienteForm, { type ClienteFormValues } from "../components/clientes/ClienteForm";
import VehiculoForm, { type VehiculoFormValues } from "../components/clientes/VehiculoForm";
import { Field, Input, Select } from "../components/ui/Field";
import { useIsMobile } from "../hooks/useMediaQuery";
import Button from "../components/ui/Button";
import CopyableValue from "../components/ui/CopyableValue";
import { IconSearch, IconCheck } from "../components/Icons";
import { formatFecha, formatMoneda } from "../utils/format";
import type { Cliente, Vehiculo, Poliza } from "../types";

type Modo = "asegurado" | "vehiculo" | "cobertura";

const CONFIG: Record<Modo, { title: string; sub: string; lookupTitle: string; lookupSub: string; label: string; ph: string }> = {
  asegurado: { title: "Editar asegurado", sub: "Modificá los datos del tomador.", lookupTitle: "Buscar asegurado", lookupSub: "Ingresá el documento del cliente para cargar sus datos.", label: "DNI / CUIT", ph: "30111222" },
  vehiculo: { title: "Editar vehículo", sub: "Modificá los datos del bien asegurado.", lookupTitle: "Buscar vehículo", lookupSub: "Ingresá la patente del vehículo a editar.", label: "Patente", ph: "AB123CD" },
  cobertura: { title: "Editar cobertura", sub: "Modificá compañía, ramo, vigencia y valores de la póliza.", lookupTitle: "Buscar póliza", lookupSub: "Ingresá el número de póliza a editar.", label: "N° de póliza", ph: "POL-202606-0001" },
};

export default function Editar() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const modo = (useParams().modo ?? "asegurado") as Modo;
  const cfg = CONFIG[modo];
  const companias = useCompanias();

  const [q, setQ] = useState("");
  const [focus, setFocus] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [noEncontrado, setNoEncontrado] = useState(false);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [vehiculo, setVehiculo] = useState<Vehiculo | null>(null);
  const [poliza, setPoliza] = useState<Poliza | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string>();

  // Vehículos del cliente encontrado (por DNI, patente o póliza) — se listan en el panel.
  const clienteIdCtx = cliente?.id ?? vehiculo?.clienteId ?? poliza?.clienteId ?? 0;
  const vehiculosCliente = useVehiculosPorCliente(clienteIdCtx);

  function reset() { setCliente(null); setVehiculo(null); setPoliza(null); setNoEncontrado(false); setSaved(false); setError(undefined); }

  async function buscar() {
    if (!q.trim()) return;
    reset();
    setBuscando(true);
    try {
      if (modo === "asegurado") {
        const doc = q.replace(/\D/g, "");
        const res = await listarClientes(doc, 1, 10);
        const c = res.items.find((x) => x.documento === doc) ?? res.items[0];
        c ? setCliente(c) : setNoEncontrado(true);
      } else if (modo === "vehiculo") {
        const v = await getVehiculoPorPatente(q.trim().toUpperCase());
        v ? setVehiculo(v) : setNoEncontrado(true);
      } else {
        const r = (await buscarGlobal(q.trim())).find((x) => x.tipo === "Poliza");
        if (!r) { setNoEncontrado(true); }
        else { const p = await getPoliza(r.referencia); setPoliza(p); }
      }
    } catch {
      setNoEncontrado(true);
    } finally {
      setBuscando(false);
    }
  }

  async function guardarCliente(v: ClienteFormValues) {
    if (!cliente) return;
    setError(undefined); setGuardando(true);
    const limpio = (s?: string) => (s && s.trim() !== "" ? s.trim() : undefined);
    try {
      await actualizarCliente(cliente.id, { nombre: v.nombre.trim(), email: limpio(v.email), telefono: limpio(v.telefono), direccion: limpio(v.direccion), fechaNacimiento: limpio(v.fechaNacimiento) });
      setSaved(true);
    } catch (e: any) { setError(e?.response?.data?.error ?? "No se pudo guardar."); } finally { setGuardando(false); }
  }
  async function guardarVehiculo(v: VehiculoFormValues) {
    if (!vehiculo) return;
    setError(undefined); setGuardando(true);
    const limpio = (s?: string) => (s && s.trim() !== "" ? s.trim() : undefined);
    try {
      await actualizarVehiculo(vehiculo.id, { marca: v.marca.trim(), modelo: v.modelo.trim(), anio: v.anio, chasis: limpio(v.chasis), motor: limpio(v.motor), combustion: limpio(v.combustion) });
      setSaved(true);
    } catch (e: any) { setError(e?.response?.data?.error ?? "No se pudo guardar."); } finally { setGuardando(false); }
  }

  const cargado = cliente || vehiculo || poliza;

  return (
    <div style={{ maxWidth: cargado ? 1080 : 820, margin: "0 auto" }}>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>
          <span style={{ cursor: "pointer" }} onClick={() => navigate("/")}>Inicio</span> · Editar
        </div>
        <h1 style={{ margin: 0, fontSize: 28, letterSpacing: "-0.025em", fontWeight: 600 }}>{cfg.title}</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 }}>{cfg.sub}</p>
      </div>

      {!cargado ? (
        <div style={{ ...card, maxWidth: 720, margin: "0 auto" }}>
          <div style={{ padding: "26px 28px 18px", borderBottom: "1px solid var(--line-2)" }}>
            <div style={kicker}>Paso 1</div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{cfg.lookupTitle}</h2>
            <p style={{ margin: "4px 0 0", color: "var(--ink-500)", fontSize: 14 }}>{cfg.lookupSub}</p>
          </div>
          <div style={{ padding: "24px 28px" }}>
            <div style={lookupWrap(focus)}>
              <IconSearch size={20} style={{ color: "var(--ink-400)" }} />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onFocus={() => setFocus(true)}
                onBlur={() => setFocus(false)}
                onKeyDown={(e) => e.key === "Enter" && buscar()}
                placeholder={cfg.ph}
                className="mono"
                style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 18, fontWeight: 500, letterSpacing: "0.04em" }}
              />
              <Button onClick={buscar} disabled={buscando}>{buscando ? "Buscando…" : "Buscar"}</Button>
            </div>
            {noEncontrado && (
              <div style={{ marginTop: 18, padding: "12px 14px", borderRadius: 10, background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 13 }}>
                No se encontró ningún resultado para «{q}».
              </div>
            )}
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: mobile ? "1fr" : "1fr 320px", gap: 22, alignItems: "start" }}>
          <div style={card}>
            <div style={{ padding: "20px 26px 18px", borderBottom: "1px solid var(--line-2)" }}>
              <div style={kicker}>Paso 2</div>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{cfg.title}</h2>
            </div>
            <div style={{ padding: "22px 26px 26px" }}>
              {saved && (
                <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--ok-100)", border: "1px solid var(--ok-500)", borderRadius: 9, fontSize: 13, color: "var(--ok-700)", display: "flex", gap: 8, alignItems: "center" }}>
                  <IconCheck size={15} /> Cambios guardados.
                </div>
              )}
              {error && <div style={{ marginBottom: 16, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{error}</div>}

              {cliente && <ClienteForm cliente={cliente} onSubmit={guardarCliente} enviando={guardando} />}
              {vehiculo && <VehiculoForm vehiculo={vehiculo} onSubmit={guardarVehiculo} enviando={guardando} />}
              {poliza && <CoberturaForm poliza={poliza} onSaved={() => setSaved(true)} setError={setError} />}

              <div style={{ marginTop: 16 }}>
                <button style={linkBtn} onClick={() => { setQ(""); reset(); }}>← Buscar otro</button>
              </div>
            </div>
          </div>

          {/* Panel de contexto */}
          <div style={ctxPanel}>
            <div style={ctxHead}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.75 }}>
                {modo === "asegurado" ? "Asegurado" : modo === "vehiculo" ? "Vehículo" : "Póliza"}
              </div>
              <div style={{ fontSize: 17, fontWeight: 600, marginTop: 4 }}>
                {cliente?.nombre ?? (vehiculo ? `${vehiculo.marca} ${vehiculo.modelo}` : poliza?.numero)}
              </div>
              <div className="mono" style={{ fontSize: 12, color: "oklch(0.85 0.04 240)", marginTop: 4 }}>
                {cliente?.documento ?? vehiculo?.patente ?? (poliza ? formatMoneda(poliza.precioTotal) : "")}
              </div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              {cliente && <>
                <Ctx k="Documento" v={cliente.documento} mono />
                <Ctx k="Tipo doc." v={cliente.tipoDocumento} />
                <Ctx k="Email" v={cliente.email} />
                <Ctx k="Teléfono" v={cliente.telefono} mono />
                <Ctx k="Dirección" v={cliente.direccion} />
                <Ctx k="Alta" v={formatFecha(cliente.fechaAlta)} mono last />
              </>}
              {vehiculo && <>
                <Ctx k="Patente" v={vehiculo.patente} mono />
                <Ctx k="Marca" v={vehiculo.marca} />
                <Ctx k="Modelo" v={vehiculo.modelo} />
                <Ctx k="Año" v={String(vehiculo.anio)} mono />
                <Ctx k="Combustión" v={vehiculo.combustion} />
                <Ctx k="N° chasis" v={vehiculo.chasis} mono />
                <Ctx k="N° motor" v={vehiculo.motor} mono />
                <Ctx k="Cobertura" v={vehiculo.tipoCobertura} last />
              </>}
              {poliza && <>
                <Ctx k="Número" v={poliza.numero} mono />
                <Ctx k="Estado" v={poliza.estado} />
                <Ctx k="Compañía" v={companias.data?.find((c) => c.id === poliza.companiaId)?.nombre} />
                <Ctx k="Ramo" v={poliza.ramoNombre} />
                <Ctx k="Cobertura" v={poliza.cobertura} />
                <Ctx k="Vigencia" v={`${formatFecha(poliza.fechaInicio)} – ${formatFecha(poliza.fechaFin)}`} mono />
                <Ctx k="Precio total" v={formatMoneda(poliza.precioTotal)} mono />
                <Ctx k="Cuotas" v={String(poliza.cantidadCuotas)} mono />
                <Ctx k="Forma de pago" v={poliza.formaPago} />
                <Ctx k="Prima OG" v={poliza.primaOG != null ? formatMoneda(poliza.primaOG) : null} mono last />
              </>}

              {(vehiculosCliente.data?.length ?? 0) > 0 && (
                <div style={{ marginTop: 14, borderTop: "1px solid var(--line-2)", paddingTop: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", color: "var(--ink-400)", marginBottom: 8 }}>Vehículos del cliente</div>
                  {vehiculosCliente.data!.map((v) => (
                    <div key={v.id} style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink-900)" }}>{v.marca} {v.modelo} <span style={{ color: "var(--ink-400)" }}>· {v.anio}</span></div>
                      <div className="mono" style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 1 }}>{v.patente}{v.tipoCobertura ? " · " + v.tipoCobertura : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CoberturaForm({ poliza, onSaved, setError }: { poliza: Poliza; onSaved: () => void; setError: (s?: string) => void }) {
  const companias = useCompanias();
  const ramos = useRamos();
  const coberturas = useCoberturas();
  const [companiaId, setCompaniaId] = useState(String(poliza.companiaId));
  const [ramoId, setRamoId] = useState(poliza.ramoId ? String(poliza.ramoId) : "");
  const [cobertura, setCobertura] = useState(poliza.cobertura ?? "");
  const [fechaInicio, setFechaInicio] = useState(poliza.fechaInicio.slice(0, 10));
  const [fechaFin, setFechaFin] = useState(poliza.fechaFin.slice(0, 10));
  // Se edita el precio POR CUOTA; el total se recalcula como cuota × cantidad.
  const [precioCuota, setPrecioCuota] = useState(
    String(Math.round((poliza.precioTotal / Math.max(1, poliza.cantidadCuotas)) * 100) / 100));
  const [cantidadCuotas, setCantidadCuotas] = useState(String(poliza.cantidadCuotas));
  const [primaOG, setPrimaOG] = useState(poliza.primaOG != null ? String(poliza.primaOG) : "");
  const [guardando, setGuardando] = useState(false);
  const qc = useQueryClient();

  async function guardar() {
    setError(undefined); setGuardando(true);
    try {
      await actualizarPoliza(poliza.id, {
        companiaId: Number(companiaId), ramoId: ramoId ? Number(ramoId) : undefined,
        fechaInicio, fechaFin,
        precioTotal: Math.round(Number(precioCuota) * Number(cantidadCuotas) * 100) / 100,
        cantidadCuotas: Number(cantidadCuotas),
        primaOG: primaOG.trim() ? Number(primaOG.replace(/[^\d.]/g, "")) : undefined,
        cobertura: cobertura || undefined,
      });
      // Al cambiar vigencia/cantidad de cuotas se regeneran los cobros: refrescar Cobranzas.
      qc.invalidateQueries({ queryKey: ["cobros"] });
      onSaved();
    } catch (e: any) { setError(e?.response?.data?.error ?? "No se pudo guardar."); } finally { setGuardando(false); }
  }

  return (
    <div>
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
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Fecha inicio"><Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /></Field>
        <Field label="Fecha fin"><Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Precio por cuota"><Input type="number" step="0.01" value={precioCuota} onChange={(e) => setPrecioCuota(e.target.value)} /></Field>
        <Field label="Cantidad de cuotas"><Input type="number" value={cantidadCuotas} onChange={(e) => setCantidadCuotas(e.target.value)} /></Field>
      </div>
      {Number(precioCuota) > 0 && Number(cantidadCuotas) > 0 && (
        <div style={{ margin: "-6px 0 14px", fontSize: 12.5, color: "var(--ink-500)" }}>
          Total de la póliza: <strong>{formatMoneda(Math.round(Number(precioCuota) * Number(cantidadCuotas) * 100) / 100)}</strong> ({cantidadCuotas} cuotas)
        </div>
      )}
      <Field label="Prima OG (interna)"><Input type="number" step="0.01" value={primaOG} onChange={(e) => setPrimaOG(e.target.value)} placeholder="Prima real de la compañía" /></Field>
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
        <Button onClick={guardar} disabled={guardando}>{guardando ? "Guardando…" : "Guardar cambios"}</Button>
      </div>
    </div>
  );
}

function Ctx({ k, v, last, mono }: { k: string; v?: string | null; last?: boolean; mono?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 0", borderBottom: last ? 0 : "1px dashed var(--line)", fontSize: 13, alignItems: "center" }}>
      <span style={{ color: "var(--ink-500)", flexShrink: 0 }}>{k}</span>
      <CopyableValue value={v} mono={mono} />
    </div>
  );
}

const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" };
const kicker: CSSProperties = { fontSize: 11.5, fontWeight: 600, color: "var(--blue-600)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 };
function lookupWrap(f: boolean): CSSProperties {
  return { display: "flex", alignItems: "center", gap: 12, padding: "0 18px", height: 60, background: "var(--paper)", border: `1.5px solid ${f ? "var(--blue-500)" : "var(--line)"}`, boxShadow: f ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none", borderRadius: 12 };
}
const ctxPanel: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden", position: "sticky", top: 84 };
const ctxHead: CSSProperties = { padding: "16px 18px", background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))", color: "white" };
const linkBtn: CSSProperties = { border: 0, background: "transparent", color: "var(--blue-600)", cursor: "pointer", fontSize: 13.5, fontWeight: 500, padding: 0 };
