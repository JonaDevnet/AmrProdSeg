import { useState, type CSSProperties } from "react";
import {
  useCompaniasAdmin, useCrearCompania, useEliminarCompania,
  useMetodosPagoAdmin, useCrearMetodoPago, useEliminarMetodoPago,
  useRamos, useCrearRamo, useEliminarRamo,
  useCoberturas, useCrearCobertura, useEliminarCobertura,
} from "../hooks/admin";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import { Input } from "../components/ui/Field";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";

export default function Companias() {
  return (
    <div>
      <PageHeader titulo="Compañías y métodos de pago" subtitulo="Catálogos compartidos. Sólo el administrador puede agregar." />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 20, alignItems: "start" }}>
        <Companias_ />
        <MetodosPago_ />
        <Ramos_ />
        <Coberturas_ />
      </div>
    </div>
  );
}

const PALETA = [
  "#b3261e", "#1e5fb3", "#1e8a5a", "#1f7fa0", "#a06a1f", "#6a3fb3",
  "#b3401e", "#2f8a3f", "#3f4fb3", "#8a7f1f",
];

function Companias_() {
  const lista = useCompaniasAdmin();
  const crear = useCrearCompania();
  const eliminar = useEliminarCompania();
  const [nombre, setNombre] = useState("");
  const [cuit, setCuit] = useState("");
  const [color, setColor] = useState(PALETA[1]);
  const [error, setError] = useState<string>();

  async function agregar() {
    setError(undefined);
    if (nombre.trim().length < 2) return setError("Ingresá un nombre.");
    try {
      await crear.mutateAsync({ nombre: nombre.trim(), cuit: cuit.trim() || undefined, color });
      setNombre(""); setCuit("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo crear la compañía.");
    }
  }

  return (
    <div style={card}>
      <h2 style={titulo}>Compañías aseguradoras</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nombre de la compañía" />
        <Input value={cuit} onChange={(e) => setCuit(e.target.value)} placeholder="CUIT (opc.)" style={{ maxWidth: 130 }} />
        <Button onClick={agregar} disabled={crear.isPending} style={{ flexShrink: 0 }}>Agregar</Button>
      </div>
      {/* Color */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
        <span style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Color:</span>
        {PALETA.map((c) => (
          <button key={c} title={c} onClick={() => setColor(c)}
            style={{ width: 20, height: 20, borderRadius: 5, background: c, cursor: "pointer", border: color === c ? "2px solid var(--ink-900)" : "1px solid var(--line)" }} />
        ))}
        <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 26, height: 26, border: "1px solid var(--line)", borderRadius: 5, background: "transparent", cursor: "pointer", padding: 0 }} />
      </div>
      {error && <div style={errBox}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        {lista.isLoading ? <Cargando /> : lista.isError ? <ErrorState /> :
          !lista.data || lista.data.length === 0 ? <VacioState mensaje="Sin compañías." /> : (
            <ul style={ul}>
              {lista.data.map((c) => (
                <li key={c.id} style={li}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 500 }}>
                    <span style={{ width: 12, height: 12, borderRadius: 3, background: c.color || "var(--ink-400)", flexShrink: 0 }} />
                    {c.nombre}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
                    {c.cuit && <span className="mono" style={{ color: "var(--ink-400)", fontSize: 12.5 }}>{c.cuit}</span>}
                    <BtnDel onClick={() => eliminar.mutate(c.id)} titulo={`Eliminar ${c.nombre}`} />
                  </span>
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}

function MetodosPago_() {
  const lista = useMetodosPagoAdmin();
  const crear = useCrearMetodoPago();
  const eliminar = useEliminarMetodoPago();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string>();

  async function agregar() {
    setError(undefined);
    if (nombre.trim().length < 2) return setError("Ingresá un nombre.");
    try {
      await crear.mutateAsync(nombre.trim());
      setNombre("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo crear el método.");
    }
  }

  return (
    <div style={card}>
      <h2 style={titulo}>Métodos de pago</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nuevo método de pago" />
        <Button onClick={agregar} disabled={crear.isPending} style={{ flexShrink: 0 }}>Agregar</Button>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        {lista.isLoading ? <Cargando /> : lista.isError ? <ErrorState /> :
          !lista.data || lista.data.length === 0 ? <VacioState mensaje="Sin métodos." /> : (
            <ul style={ul}>
              {lista.data.map((m) => {
                const fijo = /efectivo|transferencia/i.test(m.nombre);
                return (
                  <li key={m.id} style={li}>
                    <span style={{ fontWeight: 500 }}>{m.nombre}{fijo && <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 500, color: "var(--ink-400)" }}>fijo</span>}</span>
                    {!fijo && <BtnDel onClick={() => eliminar.mutate(m.id)} titulo={`Eliminar ${m.nombre}`} />}
                  </li>
                );
              })}
            </ul>
          )}
      </div>
    </div>
  );
}

function Ramos_() {
  const lista = useRamos();
  const crear = useCrearRamo();
  const eliminar = useEliminarRamo();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string>();

  async function agregar() {
    setError(undefined);
    if (nombre.trim().length < 2) return setError("Ingresá un nombre.");
    try {
      await crear.mutateAsync(nombre.trim());
      setNombre("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo crear el ramo.");
    }
  }

  return (
    <div style={card}>
      <h2 style={titulo}>Ramos</h2>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nuevo ramo (Hogar, Vida…)" />
        <Button onClick={agregar} disabled={crear.isPending} style={{ flexShrink: 0 }}>Agregar</Button>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        {lista.isLoading ? <Cargando /> : lista.isError ? <ErrorState /> :
          !lista.data || lista.data.length === 0 ? <VacioState mensaje="Sin ramos." /> : (
            <ul style={ul}>
              {lista.data.map((r) => (
                <li key={r.id} style={li}>
                  <span style={{ fontWeight: 500 }}>{r.nombre}</span>
                  <BtnDel onClick={() => eliminar.mutate(r.id)} titulo={`Eliminar ${r.nombre}`} />
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}

function Coberturas_() {
  const lista = useCoberturas();
  const crear = useCrearCobertura();
  const eliminar = useEliminarCobertura();
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string>();

  async function agregar() {
    setError(undefined);
    if (nombre.trim().length < 2) return setError("Ingresá un nombre.");
    try {
      await crear.mutateAsync(nombre.trim());
      setNombre("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo crear la cobertura.");
    }
  }

  return (
    <div style={card}>
      <h2 style={titulo}>Coberturas</h2>
      <div style={{ fontSize: 12.5, color: "var(--ink-500)", margin: "-8px 0 12px" }}>Son las opciones de cobertura al crear una póliza.</div>
      <div style={{ display: "flex", gap: 8 }}>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Nueva cobertura (Todo Riesgo…)" />
        <Button onClick={agregar} disabled={crear.isPending} style={{ flexShrink: 0 }}>Agregar</Button>
      </div>
      {error && <div style={errBox}>{error}</div>}
      <div style={{ marginTop: 12 }}>
        {lista.isLoading ? <Cargando /> : lista.isError ? <ErrorState /> :
          !lista.data || lista.data.length === 0 ? <VacioState mensaje="Sin coberturas." /> : (
            <ul style={ul}>
              {lista.data.map((c) => (
                <li key={c.id} style={li}>
                  <span style={{ fontWeight: 500 }}>{c.nombre}</span>
                  <BtnDel onClick={() => eliminar.mutate(c.id)} titulo={`Eliminar ${c.nombre}`} />
                </li>
              ))}
            </ul>
          )}
      </div>
    </div>
  );
}

function BtnDel({ onClick, titulo }: { onClick: () => void; titulo: string }) {
  return (
    <button
      title={titulo}
      onClick={() => { if (window.confirm(`${titulo}?`)) onClick(); }}
      style={{ width: 26, height: 26, flexShrink: 0, borderRadius: 7, border: "1px solid oklch(0.85 0.08 28)", background: "var(--bad-100)", color: "var(--bad-700)", cursor: "pointer", display: "grid", placeItems: "center", fontSize: 14, lineHeight: 1 }}
    >
      ×
    </button>
  );
}

const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 20 };
const titulo: CSSProperties = { fontSize: 16, fontWeight: 600, margin: "0 0 14px" };
const ul: CSSProperties = { listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 6 };
const li: CSSProperties = { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "var(--canvas)", border: "1px solid var(--line-2)", borderRadius: 8, fontSize: 14 };
const errBox: CSSProperties = { marginTop: 10, padding: "8px 12px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 8, fontSize: 13, color: "var(--bad-700)" };
