import { useState, type CSSProperties } from "react";
import { useBajas, useSolicitarBaja, useAprobarBaja, useRechazarBaja } from "../hooks/bajas";
import { useAuth } from "../auth/AuthContext";
import { buscarGlobal } from "../api/search";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Modal from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Field";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import { formatFecha } from "../utils/format";

const MOTIVOS = ["Venta del vehículo", "Cambio de compañía", "No renovación", "Solicitud del cliente", "Siniestro total", "Falta de pago", "Otro"];
const TABS: { label: string; estado: number | undefined }[] = [
  { label: "Todas", estado: undefined },
  { label: "Pendientes", estado: 0 },
  { label: "Aprobadas", estado: 1 },
  { label: "Rechazadas", estado: 2 },
];

function EstadoBadge({ estado }: { estado: number }) {
  const map: Record<number, [string, string, string]> = {
    0: ["Pendiente", "var(--warn-700)", "var(--warn-100)"],
    1: ["Aprobada", "var(--ok-700)", "var(--ok-100)"],
    2: ["Rechazada", "var(--bad-700)", "var(--bad-100)"],
  };
  const [t, c, bg] = map[estado] ?? ["—", "var(--ink-700)", "var(--line-2)"];
  return <span style={{ display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color: c, background: bg }}>{t}</span>;
}

export default function Bajas() {
  const { esAdmin, usuario } = useAuth();
  const [estado, setEstado] = useState<number | undefined>(undefined);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  // Bajas aprobadas "borradas" (descartadas) en este equipo: no vuelven a figurar hasta que haya nuevas.
  const vistasKey = `amr:bajas:vistas_${usuario?.nombre ?? "x"}`;
  const [vistas, setVistas] = useState<Set<number>>(() => {
    try { return new Set<number>(JSON.parse(localStorage.getItem(vistasKey) || "[]")); } catch { return new Set<number>(); }
  });
  const { data, isLoading, isError } = useBajas(undefined); // todas; se filtra client-side
  const aprobar = useAprobarBaja();
  const rechazar = useRechazarBaja();

  const todas = data ?? [];
  const counts = {
    total: todas.length,
    pend: todas.filter((b) => b.estado === 0).length,
    aprob: todas.filter((b) => b.estado === 1).length,
    rech: todas.filter((b) => b.estado === 2).length,
  };
  const q = search.trim().toLowerCase();
  const bajas = todas.filter((b) => {
    if (estado !== undefined && b.estado !== estado) return false;
    if (q) {
      return (b.clienteNombre ?? "").toLowerCase().includes(q)
        || (b.nroPoliza ?? "").toLowerCase().includes(q)
        || b.motivo.toLowerCase().includes(q);
    }
    return true;
  });

  // Bajas aprobadas (del servidor) — lista copiable para reportar a la compañía.
  // Se excluyen las que ya se borraron en este equipo; las nuevas vuelven a aparecer.
  const aprobadas = todas.filter((b) => b.estado === 1);
  const aprobadasVisibles = aprobadas.filter((b) => !vistas.has(b.id));

  function textoAprobadas() {
    return aprobadasVisibles
      .map((b) => {
        const f = b.fechaSolicitud ? new Date(b.fechaSolicitud).toLocaleString() : "";
        return `[${f}] Póliza: ${b.nroPoliza ?? `#${b.polizaId}`} | Cliente: ${b.clienteNombre ?? ""} | Motivo: ${b.motivo} | Solicitada por: ${b.solicitante ?? ""}`;
      })
      .join("\n");
  }

  async function copiarTodo() {
    try {
      await navigator.clipboard.writeText(textoAprobadas());
      alert("Copiado al portapapeles");
    } catch {
      /* silencioso */
    }
  }

  // "Borrar": oculta las bajas aprobadas que se están mostrando en este equipo (no borra nada del servidor).
  function borrarTexto() {
    if (aprobadasVisibles.length === 0) return;
    if (!confirm("¿Borrar el texto de las bajas aprobadas mostradas en este equipo? No se borran del sistema.")) return;
    const nuevas = new Set(vistas);
    aprobadasVisibles.forEach((b) => nuevas.add(b.id));
    setVistas(nuevas);
    try { localStorage.setItem(vistasKey, JSON.stringify([...nuevas].slice(-1000))); } catch { /* ignore */ }
  }

  return (
    <div>
      <PageHeader
        titulo="Gestión de bajas"
        subtitulo="Solicitudes de baja de pólizas. El administrador las aprueba o rechaza."
        accion={<Button variant="danger" onClick={() => setModal(true)}>Cargar baja</Button>}
      />

      {/* KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 }}>
        <Kpi l="Total registradas" n={counts.total} color="var(--ink-900)" />
        <Kpi l="Pendientes" n={counts.pend} color="var(--warn-700)" />
        <Kpi l="Aprobadas" n={counts.aprob} color="var(--ok-700)" />
        <Kpi l="Rechazadas" n={counts.rech} color="var(--bad-700)" />
      </div>

      <div style={card}>
        <div style={{ ...cardHead, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {TABS.map((t) => {
              const activo = t.estado === estado;
              return (
                <button key={t.label} onClick={() => setEstado(t.estado)} style={tab(activo)}>{t.label}</button>
              );
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "var(--paper)", border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 12px", height: 38, marginLeft: "auto", flex: 1, maxWidth: 320 }}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por cliente, póliza o motivo…"
              style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 13.5, color: "var(--ink-900)" }} />
          </div>
        </div>

        {isLoading ? <Cargando /> : isError ? <ErrorState /> : bajas.length === 0 ? (
          <VacioState mensaje="No hay bajas para este filtro." />
        ) : (
          <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Fecha</th>
                <th style={th}>Póliza</th>
                <th style={th}>Cliente</th>
                <th style={th}>Solicitada por</th>
                <th style={th}>Motivo</th>
                <th style={th}>Estado</th>
                {esAdmin && <th style={{ ...th, textAlign: "right" }}>Acción</th>}
              </tr>
            </thead>
            <tbody>
              {bajas.map((b) => (
                <tr key={b.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(b.fechaSolicitud)}</td>
                  <td style={{ ...td, fontWeight: 600 }} className="mono">{b.nroPoliza ?? `#${b.polizaId}`}</td>
                  <td style={td}>{b.clienteNombre ?? "—"}</td>
                  <td style={{ ...td, color: "var(--ink-700)" }}>{b.solicitante ?? "—"}</td>
                  <td style={{ ...td, color: "var(--ink-700)" }}>{b.motivo}</td>
                  <td style={td}><EstadoBadge estado={b.estado} /></td>
                  {esAdmin && (
                    <td style={{ ...td, textAlign: "right" }}>
                      {b.estado === 0 && (
                        <span style={{ display: "inline-flex", gap: 8, justifyContent: "flex-end" }}>
                          <Button onClick={() => aprobar.mutate(b.id)} disabled={aprobar.isPending} style={{ height: 32, padding: "0 12px", fontSize: 13, background: "var(--ok-700)" }}>Aprobar</Button>
                          <Button variant="secondary" onClick={() => rechazar.mutate(b.id)} disabled={rechazar.isPending} style={{ height: 32, padding: "0 12px", fontSize: 13 }}>Rechazar</Button>
                        </span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        )}
      </div>

      {modal && <SolicitarBajaModal onClose={() => setModal(false)} />}

      {/* Bajas solicitadas (aprobadas, desde el servidor) */}
      <section style={card} className="mt-3">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--ink-900)" }}>Bajas solicitadas</h2>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={copiarTodo}
              disabled={aprobadasVisibles.length === 0}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 9,
                border: "1px solid var(--line)",
                background: "var(--paper)",
                color: "var(--ink-700)",
                fontSize: 13,
                fontWeight: 500,
                cursor: aprobadasVisibles.length === 0 ? "default" : "pointer",
              }}
            >
              Copiar todo completo
            </button>
            <button
              onClick={borrarTexto}
              disabled={aprobadasVisibles.length === 0}
              style={{
                height: 36,
                padding: "0 12px",
                borderRadius: 9,
                border: 0,
                background: aprobadasVisibles.length === 0 ? "var(--ink-400)" : "var(--bad-600)",
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: aprobadasVisibles.length === 0 ? "default" : "pointer",
              }}
            >
              Borrar
            </button>
          </div>
        </div>
        <pre
          style={{
            background: "var(--canvas)",
            padding: 12,
            border: "1px solid var(--line)",
            borderRadius: 8,
            maxHeight: 400,
            overflow: "auto",
            fontSize: 12,
            lineHeight: 1.6,
            whiteSpace: "pre-wrap",
            margin: 0,
            fontFamily: "'JetBrains Mono', monospace",
            color: "var(--ink-700)",
          }}
        >
          {aprobadasVisibles.length === 0 ? "Sin bajas aprobadas." : textoAprobadas()}
        </pre>
        <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 6 }}>
          {aprobadasVisibles.length} ítems
        </div>
      </section>
    </div>
  );
}

function SolicitarBajaModal({ onClose }: { onClose: () => void }) {
  const solicitar = useSolicitarBaja();
  const [numero, setNumero] = useState("");
  const [motivo, setMotivo] = useState(MOTIVOS[0]);
  const [obs, setObs] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function enviar() {
    setError(undefined);
    if (!numero.trim()) return setError("Ingresá el número de póliza.");
    setBusy(true);
    try {
      const r = (await buscarGlobal(numero.trim())).find((x) => x.tipo === "Poliza");
      if (!r) { setError("No se encontró la póliza."); return; }
      await solicitar.mutateAsync({ polizaId: r.referencia, motivo, observaciones: obs.trim() || undefined });
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo registrar la baja.");
    } finally { setBusy(false); }
  }

  return (
    <Modal titulo="Cargar baja de póliza" onClose={onClose} ancho={460}>
      {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{error}</div>}
      <Field label="N° de póliza"><Input value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="POL-202606-0001" /></Field>
      <Field label="Motivo"><Select value={motivo} onChange={(e) => setMotivo(e.target.value)}>{MOTIVOS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
      <Field label="Observaciones">
        <textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={3} placeholder="Opcional"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--line)", outline: 0, fontSize: 14, resize: "vertical", fontFamily: "inherit" }} />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button variant="danger" onClick={enviar} disabled={busy}>{busy ? "Enviando…" : "Solicitar baja"}</Button>
      </div>
    </Modal>
  );
}

function Kpi({ l, n, color }: { l: string; n: number; color: string }) {
  return (
    <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 20px" }}>
      <div style={{ fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 }}>{l}</div>
      <div className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, color }}>{n}</div>
    </div>
  );
}

const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" };
const cardHead: CSSProperties = { padding: "14px 18px", borderBottom: "1px solid var(--line-2)" };
function tab(active: boolean): CSSProperties {
  return { padding: "6px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", border: 0, color: active ? "var(--navy-900)" : "var(--ink-500)", background: active ? "var(--blue-100)" : "transparent" };
}
const th: CSSProperties = { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--ink-500)", background: "oklch(0.985 0.008 245)", borderBottom: "1px solid var(--line-2)", whiteSpace: "nowrap", position: "sticky", top: 0, zIndex: 1 };
const td: CSSProperties = { padding: "14px 18px", fontSize: 14, verticalAlign: "middle" };


