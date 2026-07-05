// Portado de disenioAMR/amr_reportes.jsx — 3 tabs:
//  (A) Pagos recibidos — agrupado por compañía + desglose por método + total general
//  (B) Rendición — rango + compañía + % comisión → liquidación + export
//  (C) Hechos del día — cobros del día por rango horario
// Datos reales del endpoint /reportes/pagos-recibidos. Export a CSV (abre en Excel).
import { useMemo, useRef, useEffect, useState, type CSSProperties } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { pagosRecibidos, type VendedorFiltro } from "../api/reportes";
import { useCompanias } from "../hooks/polizas";
import { useUsuarios } from "../hooks/admin";
import { useAuth } from "../auth/AuthContext";
import type { Usuario } from "../types";
import { coColor } from "../design/companias";
import type { PagoRecibido } from "../types";
import { Icon, IconCal, IconChevD, IconCheck, IconDown } from "../design/icons";

const fmtPeso = (n: number) => "$ " + Number(n).toLocaleString("es-AR");
const isoDate = (d: Date) => d.toISOString().slice(0, 10);
const fmtDate = (iso: string) => { const [y, m, d] = iso.slice(0, 10).split("-"); return `${d}/${m}/${y}`; };
const horaDe = (iso: string) => (iso.length > 11 ? iso.slice(11, 16) : "00:00");

function hoyISO() { return isoDate(new Date()); }
function haceISO(dias: number) { const d = new Date(); d.setDate(d.getDate() - dias); return isoDate(d); }

function descargarCSV(nombre: string, filas: (string | number)[][]) {
  const csv = filas.map((r) => r.map((c) => {
    const s = String(c ?? "");
    return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = nombre; a.click();
  URL.revokeObjectURL(url);
}

function usePagos(desde: string, hasta: string, companiaId?: number, vendedor?: VendedorFiltro) {
  return useQuery({
    queryKey: ["pagos-recibidos", desde, hasta, companiaId ?? null, vendedor?.vendedorId ?? null, vendedor?.vendedorRol ?? null],
    queryFn: () => pagosRecibidos(desde, hasta, companiaId, vendedor),
    placeholderData: keepPreviousData,
  });
}

export default function Reportes() {
  const [tab, setTab] = useState<"pagos" | "rendicion" | "hechos">("pagos");
  const { esAdmin, usuario } = useAuth();
  const { data: companias = [] } = useCompanias();
  // El selector de vendedor es exclusivo del Admin (el endpoint /usuarios también lo es).
  const { data: usuarios = [] } = useUsuarios({ enabled: esAdmin });
  // Selección del filtro: "" (todos) | "me" (yo) | "rol:Admin" (todos los admins) | "u:<id>" (un productor)
  const [sel, setSel] = useState("");
  const colorDe = useMemo(() => {
    const m = new Map<number, string>();
    companias.forEach((c, i) => m.set(c.id, c.color || coColor(i)));
    return m;
  }, [companias]);

  const productores = usuarios.filter((u: Usuario) => u.rol === "Productor");
  const hayAdmins = usuarios.some((u: Usuario) => u.rol === "Admin");
  // "Yo": se ubica al usuario logueado en la lista por nombre (la sesión no guarda el Id).
  const miId = usuarios.find((u: Usuario) => u.nombre === usuario?.nombre)?.id;

  const vendedor: VendedorFiltro | undefined = useMemo(() => {
    if (sel === "me" && miId !== undefined) return { vendedorId: miId };
    if (sel === "rol:Admin") return { vendedorRol: "Admin" };
    if (sel.startsWith("u:")) return { vendedorId: Number(sel.slice(2)) };
    return undefined;
  }, [sel, miId]);

  return (
    <div>
      <div style={S.hero}>
        <div>
          <div style={S.crumb}>Inicio · Reportes</div>
          <h1 style={S.h1}>Reportes</h1>
          <p style={S.sub}>Análisis de cobros por compañía y método, rendiciones y hechos del día.</p>
        </div>
        {esAdmin && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)" }}>Vendedor</span>
            <select
              value={sel}
              onChange={(e) => setSel(e.target.value)}
              style={{ height: 40, padding: "0 12px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--paper)", fontSize: 14, fontWeight: 500, color: "var(--ink-900)", cursor: "pointer" }}
            >
              <option value="">Todos los vendedores</option>
              {miId !== undefined && <option value="me">Solo yo (mis ventas)</option>}
              {hayAdmins && <option value="rol:Admin">Administrador (todos)</option>}
              {productores.length > 0 && <optgroup label="Productores">
                {productores.map((u: Usuario) => (
                  <option key={u.id} value={`u:${u.id}`}>{u.nombre}{u.id === miId ? " — yo" : ""}</option>
                ))}
              </optgroup>}
            </select>
          </div>
        )}
      </div>

      <div style={S.tabs}>
        <button style={F.tab(tab === "pagos")} onClick={() => setTab("pagos")}>
          <Icon size={15} d={<><rect x="2" y="6" width="20" height="12" rx="2" /><path d="M2 10h20M6 14h4" /></>} /> Pagos recibidos
        </button>
        <button style={F.tab(tab === "rendicion")} onClick={() => setTab("rendicion")}>
          <Icon size={15} d={<><path d="M3 3h18v18H3z" /><path d="M3 9h18M9 21V9" /></>} /> Rendición
        </button>
        <button style={F.tab(tab === "hechos")} onClick={() => setTab("hechos")}>
          <Icon size={15} d={<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 3" /></>} /> Hechos del día
        </button>
      </div>

      <section style={S.shell}>
        {tab === "pagos" && <PagosTab companias={companias} colorDe={colorDe} vendedor={vendedor} />}
        {tab === "rendicion" && <RendicionTab companias={companias} colorDe={colorDe} vendedor={vendedor} />}
        {tab === "hechos" && <HechosTab colorDe={colorDe} vendedor={vendedor} />}
      </section>
    </div>
  );
}

/* ───────── Pagos recibidos ───────── */
function PagosTab({ companias, colorDe, vendedor }: { companias: { id: number; nombre: string }[]; colorDe: Map<number, string>; vendedor?: VendedorFiltro }) {
  const [from, setFrom] = useState(haceISO(90));
  const [to, setTo] = useState(hoyISO());
  const { data: pagos = [], isLoading } = usePagos(from, to, undefined, vendedor);
  // Listas largas colapsadas: cada compañía muestra 10 cobros y se puede expandir.
  const [abiertas, setAbiertas] = useState<Record<string, boolean>>({});

  const byCo = useMemo(() => {
    const acc: Record<string, { total: number; items: PagoRecibido[]; met: Record<string, number>; companiaId: number }> = {};
    for (const p of pagos) {
      (acc[p.compania] ??= { total: 0, items: [], met: {}, companiaId: p.companiaId });
      acc[p.compania].total += p.monto;
      acc[p.compania].items.push(p);
      acc[p.compania].met[p.metodo] = (acc[p.compania].met[p.metodo] || 0) + p.monto;
    }
    return acc;
  }, [pagos]);
  const cos = Object.keys(byCo).sort((a, b) => byCo[b].total - byCo[a].total);
  const grandTotal = pagos.reduce((a, p) => a + p.monto, 0);
  const totalMethods = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of pagos) m[p.metodo] = (m[p.metodo] || 0) + p.monto;
    return m;
  }, [pagos]);
  const metodoTop = Object.keys(totalMethods).sort((a, b) => totalMethods[b] - totalMethods[a])[0];

  const exportar = () => {
    const filas: (string | number)[][] = [
      ["Reporte de pagos recibidos"], ["Período", `${fmtDate(from)} - ${fmtDate(to)}`], [],
      ["Fecha", "Cliente", "Póliza", "Patente", "Compañía", "Ramo", "Método", "Monto"],
      ...pagos.map((p) => [fmtDate(p.fechaPago), p.clienteNombre, p.nroPoliza, p.patente ?? "-", p.compania, p.ramo, p.metodo, p.monto]),
      [], ["", "", "", "", "", "", "TOTAL", grandTotal],
    ];
    descargarCSV(`AMR-Pagos-${from}_a_${to}.csv`, filas);
  };

  return (
    <>
      <div style={S.kpis}>
        <Kpi l="Total cobrado" n={fmtPeso(grandTotal)} sub={`${pagos.length} pagos registrados`} />
        <Kpi l="Compañías con cobro" n={String(cos.length)} sub={`de ${companias.length} aseguradoras`} />
        <Kpi l="Ticket promedio" n={pagos.length ? fmtPeso(Math.round(grandTotal / pagos.length)) : fmtPeso(0)} sub="por pago" />
        <Kpi l="Método principal" n={metodoTop || "—"} small sub={metodoTop ? `${Math.round((totalMethods[metodoTop] / grandTotal) * 100)}% del total` : "Sin datos"} />
      </div>

      <div style={S.toolbar}>
        <span style={S.toolL}>Período</span>
        <div style={S.toolDate}>
          <IconCal size={15} style={{ color: "var(--ink-400)" }} />
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={S.toolInput} />
          <span style={{ color: "var(--ink-400)" }}>→</span>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={S.toolInput} />
        </div>
        <button style={S.exportBtn} onClick={exportar} disabled={pagos.length === 0}><IconDown size={15} /> Exportar Excel</button>
      </div>

      {isLoading ? (
        <Vacio texto="Cargando…" />
      ) : cos.length === 0 ? (
        <Vacio texto="No hay cobros registrados en el período seleccionado." />
      ) : cos.map((co) => {
        const data = byCo[co];
        const color = colorDe.get(data.companiaId) ?? "var(--ink-400)";
        const maxMet = Math.max(...Object.values(data.met));
        return (
          <div key={co} style={S.coSection}>
            <div style={S.coHead}>
              <div style={S.coName}><span style={{ width: 12, height: 12, borderRadius: 3, background: color }} />{co}<span style={S.coMeta}>· {data.items.length} cobros</span></div>
              <div style={S.coAmt}>{fmtPeso(data.total)}</div>
            </div>
            <div style={S.bars}>
              {Object.entries(data.met).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                <div key={m} style={S.bar}>
                  <div style={S.barL}><span style={S.barName}>{m}</span><span style={S.barAmt}>{fmtPeso(v)}</span></div>
                  <div style={S.barTrack}><div style={{ width: (v / maxMet) * 100 + "%", height: "100%", background: color, borderRadius: 4 }} /></div>
                  <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-500)" }}>{Math.round((v / data.total) * 100)}% del total</div>
                </div>
              ))}
            </div>
            <table style={{ ...S.table, marginTop: 14 }}>
              <thead><tr>
                <th style={S.th}>Fecha</th><th style={S.th}>Cliente</th><th style={S.th}>Póliza</th><th style={S.th}>Ramo</th><th style={S.th}>Método</th><th style={{ ...S.th, textAlign: "right" }}>Monto</th>
              </tr></thead>
              <tbody>
                {(abiertas[co] ? data.items : data.items.slice(0, 10)).map((p) => (
                  <tr key={p.id}>
                    <td style={{ ...S.td, fontFamily: mono, fontSize: 12.5 }}>{fmtDate(p.fechaPago)}</td>
                    <td style={{ ...S.td, fontWeight: 500 }}>{p.clienteNombre}</td>
                    <td style={{ ...S.td, fontFamily: mono, fontSize: 12.5 }}>{p.nroPoliza}</td>
                    <td style={{ ...S.td, color: "var(--ink-700)" }}>{p.ramo}</td>
                    <td style={S.td}><span style={F.metPill(p.metodo)}>{p.metodo}</span></td>
                    <td style={{ ...S.td, textAlign: "right", fontFamily: mono, fontWeight: 500 }}>{fmtPeso(p.monto)}</td>
                  </tr>
                ))}
                {data.items.length > 10 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <button onClick={() => setAbiertas((a) => ({ ...a, [co]: !a[co] }))}
                        style={{ width: "100%", padding: "10px", border: 0, background: "var(--blue-50)", color: "var(--blue-600)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                        {abiertas[co] ? "▲ Ver menos" : `▼ Ver los ${data.items.length} cobros`}
                      </button>
                    </td>
                  </tr>
                )}
                <tr>
                  <td colSpan={5} style={{ ...S.td, textAlign: "right", color: "var(--ink-700)", fontWeight: 600, background: "oklch(0.985 0.008 245)" }}>Subtotal {co} ({data.items.length} cobros del período)</td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: mono, fontWeight: 700, fontSize: 14, background: "oklch(0.985 0.008 245)" }}>{fmtPeso(data.total)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      })}

      {cos.length > 0 && (
        <div style={S.grandTotal}>
          <div>
            <div style={S.gtL}>Total general consolidado</div>
            <div style={S.gtN}>{fmtPeso(grandTotal)}</div>
            <div style={S.gtSub}>{pagos.length} pagos · {cos.length} compañías · período {fmtDate(from)} – {fmtDate(to)}</div>
          </div>
          <div style={S.gtRight}>
            {Object.entries(totalMethods).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
              <div key={m} style={S.gtChip}>{m} <span style={S.gtChipN}>{fmtPeso(v)}</span></div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}

/* ───────── Rendición ───────── */
// Clasifica el medio de pago: se rinden Efectivo y Transferencia (Mercado Pago se unifica a Transferencia).
function claseMetodo(m: string): "efectivo" | "transferencia" | "otro" {
  const s = (m || "").toLowerCase();
  if (s.includes("efectivo")) return "efectivo";
  if (s.includes("transfer") || s.includes("mercado")) return "transferencia";
  return "otro";
}

function RendicionTab({ companias, colorDe, vendedor }: { companias: { id: number; nombre: string }[]; colorDe: Map<number, string>; vendedor?: VendedorFiltro }) {
  const { esAdmin } = useAuth();
  const [companiaId, setCompaniaId] = useState<number | undefined>(undefined);
  const [from, setFrom] = useState(haceISO(90));
  const [to, setTo] = useState(hoyISO());
  const [pct, setPct] = useState(15);
  const [incluirComision, setIncluirComision] = useState(true);
  const [restarDiferencia, setRestarDiferencia] = useState(false); // solo Admin
  const [coOpen, setCoOpen] = useState(false);
  const coRef = useRef<HTMLDivElement>(null);

  useEffect(() => { if (companiaId === undefined && companias.length) setCompaniaId(companias[0].id); }, [companias, companiaId]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (coRef.current && !coRef.current.contains(e.target as Node)) setCoOpen(false); };
    window.addEventListener("mousedown", h);
    return () => window.removeEventListener("mousedown", h);
  }, []);

  const { data: items = [] } = usePagos(from, to, companiaId, vendedor);
  const compania = companias.find((c) => c.id === companiaId);

  // Desglose por medio de pago. SE RINDEN: Efectivo + Transferencia (Mercado Pago unificado a Transferencia).
  // El resto (Débito automático, Tarjeta, CBU, …) NO se rinde: se lista aparte.
  const { efectivo, transferencia, otros, totalOtros, totalRendible, total } = useMemo(() => {
    let efectivo = 0, transferencia = 0;
    const otros: Record<string, number> = {};
    for (const p of items) {
      const c = claseMetodo(p.metodo);
      if (c === "efectivo") efectivo += p.monto;
      else if (c === "transferencia") transferencia += p.monto;
      else otros[p.metodo] = (otros[p.metodo] || 0) + p.monto;
    }
    const totalOtros = Object.values(otros).reduce((a, v) => a + v, 0);
    const totalRendible = efectivo + transferencia;
    return { efectivo, transferencia, otros, totalOtros, totalRendible, total: totalRendible + totalOtros };
  }, [items]);

  // Diferencia por cuota: por cada cobro que se rinde, cobrado − prima OG (la prima OG ya es por cuota).
  // Ej.: cuota cobrada 11000, prima OG 10000 → diferencia 1000. Se suma; el Admin puede restarla del total a rendir.
  const { primaOgRendible, diferencia } = useMemo(() => {
    let primaOg = 0, dif = 0;
    for (const p of items) {
      const c = claseMetodo(p.metodo);
      if (c !== "efectivo" && c !== "transferencia") continue;
      const prima = p.primaOG || 0;
      primaOg += prima;
      dif += p.monto - prima;
    }
    return { primaOgRendible: Math.round(primaOg), diferencia: Math.round(dif) };
  }, [items]);

  const comision = incluirComision ? Math.round(totalRendible * (pct / 100)) : 0;
  const restaDif = esAdmin && restarDiferencia ? diferencia : 0; // opción Admin: restar la diferencia (Prima OG)
  const totalARendir = totalRendible - comision - restaDif; // Efectivo + Transferencia (− comisión / − diferencia opcionales)
  const color = companiaId !== undefined ? (colorDe.get(companiaId) ?? "var(--ink-400)") : "var(--ink-400)";

  const exportar = () => {
    const otrosEntries = Object.entries(otros).sort((a, b) => b[1] - a[1]);

    const filas: (string | number)[][] = [
      ["Rendición de pagos"],
      ["Compañía", compania?.nombre ?? ""],
      ["Período", `${fmtDate(from)} - ${fmtDate(to)}`],
      [],
      // ── Medios que se rinden ──
      ["MEDIOS QUE SE RINDEN"],
      ["Método", "Monto"],
      ["Efectivo", efectivo],
      ["Transferencia (incl. Mercado Pago)", transferencia],
      ["Total medios a rendir", totalRendible],
    ];
    if (incluirComision) filas.push([`Comisión productor (${pct}%)`, -comision]);
    if (restaDif !== 0) filas.push(["Diferencia (Prima OG) restada", -restaDif]);
    filas.push(["TOTAL A RENDIR", totalARendir]);

    // Secciones exclusivas del Admin (los productores solo rinden su total).
    if (esAdmin) {
      filas.push([]);
      filas.push(["OTROS MEDIOS (no se rinden)"]);
      filas.push(["Método", "Monto"]);
      if (otrosEntries.length === 0) filas.push(["(sin otros medios en el período)", 0]);
      otrosEntries.forEach(([m, v]) => filas.push([m, v]));
      filas.push(["Total otros medios", totalOtros]);
      filas.push(["Total cobrado (todos los medios)", total]);
      filas.push([]);
      // Referencia Prima OG por cuota: cobrado − prima OG (la prima OG ya es por cuota), sólo cobros que se rinden.
      filas.push(["REFERENCIA — Prima OG (diferencia por cuota, medios que se rinden)"]);
      filas.push(["Fecha", "Cliente", "Póliza", "Patente", "Cuota", "Método", "Cobrado", "Prima OG", "Diferencia"]);
      items.filter((p) => { const c = claseMetodo(p.metodo); return c === "efectivo" || c === "transferencia"; })
        .forEach((p) => {
          const prima = p.primaOG || 0;
          filas.push([fmtDate(p.fechaPago), p.clienteNombre, p.nroPoliza, p.patente ?? "-", p.numeroCuota, p.metodo, p.monto, prima, p.monto - prima]);
        });
      filas.push(["TOTALES", "", "", "", "", "", totalRendible, primaOgRendible, diferencia]);
    }
    filas.push([]);
    // ── Detalle por cuota (todos los medios) ──
    filas.push(["DETALLE POR CUOTA"]);
    filas.push(["Fecha", "Cliente", "Póliza", "Patente", "Ramo", "Método", "Cobrado"]);
    items.forEach((p) => filas.push([fmtDate(p.fechaPago), p.clienteNombre, p.nroPoliza, p.patente ?? "-", p.ramo, p.metodo, p.monto]));

    descargarCSV(`AMR-Rendicion-${(compania?.nombre ?? "").replace(/\s/g, "_")}-${from}_a_${to}.csv`, filas);
  };

  return (
    <div style={S.renShell}>
      <div style={S.renCard}>
        <div style={S.renHead}>
          <div style={S.renKicker}>Rendición · Liquidación</div>
          <h2 style={S.renTitle}>Parámetros de la rendición</h2>
          <p style={S.renSub}>Seleccioná la compañía y el rango de fechas. La comisión la define el % del productor.</p>
        </div>
        <div style={S.renBody}>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Compañía <span style={{ color: "var(--bad-700)" }}>*</span></div>
          <div ref={coRef} style={{ position: "relative", marginBottom: 16 }}>
            <div onClick={() => setCoOpen((o) => !o)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 14px", height: 46, border: "1.5px solid " + (coOpen ? "var(--blue-500)" : "var(--line)"), boxShadow: coOpen ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "none", borderRadius: 10, cursor: "pointer", background: "var(--paper)" }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: color }} />
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{compania?.nombre ?? "Seleccionar"}</span>
              <IconChevD size={16} style={{ color: "var(--ink-400)", transform: coOpen ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
            </div>
            {coOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", left: 0, right: 0, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 20, maxHeight: 280, overflowY: "auto" }}>
                {companias.map((c, i) => (
                  <div key={c.id} onClick={() => { setCompaniaId(c.id); setCoOpen(false); }} style={{ padding: "9px 12px", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, background: companiaId === c.id ? "var(--blue-100)" : "transparent" }}
                    onMouseEnter={(e) => { if (companiaId !== c.id) e.currentTarget.style.background = "var(--blue-50)"; }}
                    onMouseLeave={(e) => { if (companiaId !== c.id) e.currentTarget.style.background = "transparent"; }}>
                    <span style={{ width: 10, height: 10, borderRadius: 3, background: coColor(i) }} />
                    <span style={{ flex: 1 }}>{c.nombre}</span>
                    {companiaId === c.id && <IconCheck size={14} style={{ color: "var(--blue-600)" }} />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Desde</div>
              <div style={S.dateField}><IconCal size={15} style={{ color: "var(--ink-400)" }} /><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14 }} /></div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Hasta</div>
              <div style={S.dateField}><IconCal size={15} style={{ color: "var(--ink-400)" }} /><input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14 }} /></div>
            </div>
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-700)", marginTop: 16, cursor: "pointer", fontWeight: 500 }}>
            <input type="checkbox" checked={incluirComision} onChange={(e) => setIncluirComision(e.target.checked)} style={{ width: 16, height: 16 }} />
            <span>Aplicar comisión del productor</span>
          </label>

          {esAdmin && (
            <label style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-700)", marginTop: 12, cursor: "pointer", fontWeight: 500 }}>
              <input type="checkbox" checked={restarDiferencia} onChange={(e) => setRestarDiferencia(e.target.checked)} style={{ width: 16, height: 16 }} />
              <span>Restar la diferencia (Prima OG) del total a rendir</span>
            </label>
          )}

          <div style={{ marginTop: 14, opacity: incluirComision ? 1 : 0.45, pointerEvents: incluirComision ? "auto" : "none" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8, display: "flex", justifyContent: "space-between" }}>
              <span>Comisión del productor</span><span style={{ fontFamily: mono, color: "var(--navy-900)" }}>{pct} %</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <input type="range" min={0} max={40} step={0.5} value={pct} onChange={(e) => setPct(parseFloat(e.target.value))} style={{ flex: 1, accentColor: "var(--navy-900)" }} />
              <div style={{ display: "flex", alignItems: "center", gap: 4, border: "1.5px solid var(--line)", borderRadius: 9, padding: "0 12px", height: 38 }}>
                <input type="number" value={pct} step={0.5} min={0} max={100} onChange={(e) => setPct(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))} style={{ width: 50, border: 0, outline: 0, background: "transparent", fontSize: 14, fontFamily: mono, textAlign: "right" }} />
                <span style={{ color: "var(--ink-500)" }}>%</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
              {[10, 15, 20, 25].map((p) => (
                <button key={p} onClick={() => setPct(p)} style={{ padding: "5px 11px", borderRadius: 999, border: "1px solid " + (pct === p ? "var(--navy-900)" : "var(--line)"), background: pct === p ? "var(--navy-900)" : "var(--paper)", color: pct === p ? "white" : "var(--ink-700)", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>{p}%</button>
              ))}
            </div>
          </div>
        </div>
        <div style={{ padding: "16px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>{items.length} cobros encontrados en el período</div>
          <button style={S.exportBtn} onClick={exportar} disabled={items.length === 0}><IconDown size={15} /> Generar y exportar Excel</button>
        </div>
      </div>

      <div style={S.renCard}>
        <div style={S.renHead}>
          <div style={S.renKicker}>Vista previa</div>
          <h2 style={S.renTitle}>{compania?.nombre ?? "—"}</h2>
          <p style={S.renSub}><span className="mono">{fmtDate(from)}</span> al <span className="mono">{fmtDate(to)}</span></p>
        </div>
        <div style={S.renBody}>
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--line)", borderRadius: 10 }}>
            {items.length === 0 ? (
              <div style={{ padding: "30px 16px", textAlign: "center", color: "var(--ink-500)", fontSize: 13.5 }}>No hay cobros para esta compañía en el período.</div>
            ) : items.map((p, i) => (
              <div key={p.id} style={{ display: "grid", gridTemplateColumns: "70px 1fr auto", alignItems: "center", gap: 10, padding: "10px 14px", borderBottom: i < items.length - 1 ? "1px solid var(--line-2)" : 0, fontSize: 13 }}>
                <span className="mono" style={{ fontSize: 12, color: "var(--ink-500)" }}>{fmtDate(p.fechaPago)}</span>
                <div><div style={{ fontWeight: 500, color: "var(--ink-900)" }}>{p.clienteNombre}</div><div style={{ fontSize: 11.5, color: "var(--ink-500)", marginTop: 2 }}>{p.metodo}</div></div>
                <span className="mono" style={{ fontWeight: 600, fontSize: 13 }}>{fmtPeso(p.monto)}</span>
              </div>
            ))}
          </div>
          <div style={S.renPreviewBox}>
            <div style={S.rpL}>Medios que se rinden</div>
            <div style={{ marginTop: 10 }}>
              <div style={S.rpRow}><span>Efectivo</span><span style={S.rpV}>{fmtPeso(efectivo)}</span></div>
              <div style={S.rpRow}><span>Transferencia <span style={{ opacity: 0.6 }}>(incl. Mercado Pago)</span></span><span style={S.rpV}>{fmtPeso(transferencia)}</span></div>
              {incluirComision && <div style={S.rpRow}><span>Comisión productor ({pct}%)</span><span style={S.rpV}>− {fmtPeso(comision)}</span></div>}
              {restaDif !== 0 && <div style={S.rpRow}><span>Diferencia (Prima OG) restada</span><span style={S.rpV}>{restaDif >= 0 ? "− " : "+ "}{fmtPeso(Math.abs(restaDif))}</span></div>}
              <div style={S.rpTotalRow}><span>Total a rendir</span><span style={S.rpTotal}>{fmtPeso(totalARendir)}</span></div>
            </div>

            {/* Otros medios y Referencia Prima OG: sólo para el Admin. El productor solo ve su total a rendir. */}
            {esAdmin && (
              <div style={{ ...S.rpL, marginTop: 20 }}>Otros medios <span style={{ opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>(no se rinden)</span></div>
            )}
            {esAdmin && (
              <div style={{ marginTop: 10 }}>
                {Object.keys(otros).length === 0
                  ? <div style={{ ...S.rpRow, opacity: 0.7 }}><span>Sin otros medios en el período</span><span style={S.rpV}>{fmtPeso(0)}</span></div>
                  : Object.entries(otros).sort((a, b) => b[1] - a[1]).map(([m, v]) => (
                      <div key={m} style={S.rpRow}><span>{m}</span><span style={S.rpV}>{fmtPeso(v)}</span></div>
                    ))}
                <div style={S.rpRow}><span style={{ opacity: 0.8 }}>Total otros medios</span><span style={S.rpV}>{fmtPeso(totalOtros)}</span></div>
                <div style={S.rpRow}><span style={{ opacity: 0.8 }}>Total cobrado (todos)</span><span style={S.rpV}>{fmtPeso(total)}</span></div>
              </div>
            )}

            {esAdmin && (<>
              <div style={{ ...S.rpL, marginTop: 20 }}>Referencia · Prima OG <span style={{ opacity: 0.6, textTransform: "none", letterSpacing: 0 }}>(por cuota, medios que se rinden)</span></div>
              <div style={{ marginTop: 10 }}>
                <div style={S.rpRow}><span>Cobrado (efectivo + transf.)</span><span style={S.rpV}>{fmtPeso(totalRendible)}</span></div>
                <div style={S.rpRow}><span>Prima OG (por cuota)</span><span style={S.rpV}>{fmtPeso(primaOgRendible)}</span></div>
                <div style={S.rpRow}><span>Diferencia (cobrado − prima OG)</span><span style={{ ...S.rpV, color: diferencia < 0 ? "oklch(0.85 0.12 28)" : "oklch(0.88 0.10 155)" }}>{diferencia < 0 ? "− " : "+ "}{fmtPeso(Math.abs(diferencia))}</span></div>
              </div>
            </>)}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Hechos del día ───────── */
function HechosTab({ colorDe, vendedor }: { colorDe: Map<number, string>; vendedor?: VendedorFiltro }) {
  const { usuario } = useAuth();
  const cfgKey = `amr_horarios_hechos_${usuario?.nombre ?? "x"}`;
  const [horarios, setHorarios] = useState<{ mananaD: string; mananaH: string; tardeD: string; tardeH: string }>(() => {
    try { const r = JSON.parse(localStorage.getItem(cfgKey) || "null"); if (r) return r; } catch { /* ignore */ }
    return { mananaD: "08:00", mananaH: "12:59", tardeD: "13:00", tardeH: "17:59" };
  });
  const [cfgOpen, setCfgOpen] = useState(false);
  const [fecha, setFecha] = useState(hoyISO());
  const [hDesde, setHDesde] = useState("00:00");
  const [hHasta, setHHasta] = useState("23:59");
  const [verTodo, setVerTodo] = useState(false);
  const { data: pagos = [] } = usePagos(fecha, fecha, undefined, vendedor);

  function guardarHorarios(next: typeof horarios) {
    setHorarios(next);
    try { localStorage.setItem(cfgKey, JSON.stringify(next)); } catch { /* ignore */ }
  }

  const filtered = useMemo(() => pagos
    .map((p) => ({ ...p, hora: horaDe(p.fechaPago) }))
    .filter((p) => p.hora >= hDesde && p.hora <= hHasta)
    .sort((a, b) => a.hora.localeCompare(b.hora)), [pagos, hDesde, hHasta]);
  const total = filtered.reduce((a, p) => a + p.monto, 0);
  const met: Record<string, number> = {};
  filtered.forEach((p) => (met[p.metodo] = (met[p.metodo] || 0) + p.monto));
  const metTop = Object.keys(met).sort((a, b) => met[b] - met[a])[0];

  const presets = [
    { l: "Mañana", d: horarios.mananaD, h: horarios.mananaH },
    { l: "Tarde", d: horarios.tardeD, h: horarios.tardeH },
    { l: "Todo el día", d: "00:00", h: "23:59" },
  ];

  const exportar = () => {
    const filas: (string | number)[][] = [
      ["Hechos del día — cuotas pagadas"], ["Fecha", fmtDate(fecha)], ["Rango horario", `${hDesde} - ${hHasta}`], [],
      ["Hora", "Cliente", "Póliza", "Patente", "Compañía", "Ramo", "Método", "Monto"],
      ...filtered.map((p) => [p.hora, p.clienteNombre, p.nroPoliza, p.patente ?? "-", p.compania, p.ramo, p.metodo, p.monto]),
      [], ["", "", "", "", "", "", "TOTAL", total],
    ];
    descargarCSV(`AMR-Hechos-${fecha}.csv`, filas);
  };

  return (
    <>
      <div style={{ ...S.toolbar, flexWrap: "wrap", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={S.toolL}>Fecha</span>
          <div style={S.toolDate}><IconCal size={15} style={{ color: "var(--ink-400)" }} /><input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} style={S.toolInput} /></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={S.toolL}>Desde</span>
          <div style={S.toolDate}><input type="time" value={hDesde} onChange={(e) => setHDesde(e.target.value)} style={S.toolInput} /></div>
          <span style={S.toolL}>Hasta</span>
          <div style={S.toolDate}><input type="time" value={hHasta} onChange={(e) => setHHasta(e.target.value)} style={S.toolInput} /></div>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {presets.map((p) => (
            <button key={p.l} onClick={() => { setHDesde(p.d); setHHasta(p.h); }} style={{ height: 34, padding: "0 12px", borderRadius: 8, border: "1px solid " + (hDesde === p.d && hHasta === p.h ? "var(--navy-900)" : "var(--line)"), background: hDesde === p.d && hHasta === p.h ? "var(--navy-900)" : "var(--paper)", color: hDesde === p.d && hHasta === p.h ? "white" : "var(--ink-700)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>{p.l}</button>
          ))}
          <button onClick={() => setCfgOpen((o) => !o)} title="Configurar horarios de mañana/tarde" style={{ height: 34, padding: "0 10px", borderRadius: 8, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 12.5, fontWeight: 500, cursor: "pointer" }}>⚙ Horarios</button>
        </div>
        <button style={{ ...S.exportBtn, marginLeft: "auto" }} onClick={exportar} disabled={filtered.length === 0}><IconDown size={15} /> Exportar Excel</button>
      </div>

      {cfgOpen && (
        <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, padding: "14px 18px", marginBottom: 14, display: "flex", gap: 24, alignItems: "flex-end", flexWrap: "wrap" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)", marginBottom: 8 }}>Mañana</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={S.toolDate}><span style={{ fontSize: 11, color: "var(--ink-400)" }}>Desde</span><input type="time" value={horarios.mananaD} onChange={(e) => guardarHorarios({ ...horarios, mananaD: e.target.value })} style={S.toolInput} /></div>
              <div style={S.toolDate}><span style={{ fontSize: 11, color: "var(--ink-400)" }}>Hasta</span><input type="time" value={horarios.mananaH} onChange={(e) => guardarHorarios({ ...horarios, mananaH: e.target.value })} style={S.toolInput} /></div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-700)", marginBottom: 8 }}>Tarde</div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={S.toolDate}><span style={{ fontSize: 11, color: "var(--ink-400)" }}>Desde</span><input type="time" value={horarios.tardeD} onChange={(e) => guardarHorarios({ ...horarios, tardeD: e.target.value })} style={S.toolInput} /></div>
              <div style={S.toolDate}><span style={{ fontSize: 11, color: "var(--ink-400)" }}>Hasta</span><input type="time" value={horarios.tardeH} onChange={(e) => guardarHorarios({ ...horarios, tardeH: e.target.value })} style={S.toolInput} /></div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-400)" }}>Se guarda por usuario en este equipo.</div>
        </div>
      )}

      <div style={S.kpis}>
        <Kpi l="Total cobrado" n={fmtPeso(total)} sub={`${filtered.length} pagos · ${fmtDate(fecha)}`} />
        <Kpi l="Cantidad de cobros" n={String(filtered.length)} sub={`${hDesde} – ${hHasta} hs`} />
        <Kpi l="Ticket promedio" n={filtered.length ? fmtPeso(Math.round(total / filtered.length)) : fmtPeso(0)} sub="por cuota" />
        <Kpi l="Método principal" n={metTop || "—"} small sub={metTop ? `${Math.round((met[metTop] / total) * 100)}% del total` : "Sin datos"} />
      </div>

      <div style={{ background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-500)", fontSize: 14 }}>No hay cobros registrados para el período seleccionado.</div>
        ) : (
          <table style={S.table}>
            <thead><tr>
              <th style={S.th}>Hora</th><th style={S.th}>Cliente</th><th style={S.th}>Póliza</th><th style={S.th}>Compañía</th><th style={S.th}>Ramo</th><th style={S.th}>Método</th><th style={{ ...S.th, textAlign: "right" }}>Monto</th>
            </tr></thead>
            <tbody>
              {(verTodo ? filtered : filtered.slice(0, 10)).map((p) => (
                <tr key={p.id}>
                  <td style={{ ...S.td, fontFamily: mono, fontSize: 13, fontWeight: 600, color: "var(--blue-700)" }}>{p.hora} hs</td>
                  <td style={{ ...S.td, fontWeight: 500 }}>{p.clienteNombre}</td>
                  <td style={{ ...S.td, fontFamily: mono, fontSize: 12.5 }}>{p.nroPoliza}</td>
                  <td style={S.td}><span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><span style={{ width: 8, height: 8, borderRadius: 2, background: colorDe.get(p.companiaId) ?? "var(--ink-400)" }} />{p.compania}</span></td>
                  <td style={{ ...S.td, color: "var(--ink-700)" }}>{p.ramo}</td>
                  <td style={S.td}><span style={F.metPill(p.metodo)}>{p.metodo}</span></td>
                  <td style={{ ...S.td, textAlign: "right", fontFamily: mono, fontWeight: 600 }}>{fmtPeso(p.monto)}</td>
                </tr>
              ))}
              {filtered.length > 10 && (
                <tr>
                  <td colSpan={7} style={{ padding: 0 }}>
                    <button onClick={() => setVerTodo((v) => !v)}
                      style={{ width: "100%", padding: "10px", border: 0, background: "var(--blue-50)", color: "var(--blue-600)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                      {verTodo ? "▲ Ver menos" : `▼ Ver los ${filtered.length} cobros`}
                    </button>
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={6} style={{ ...S.td, textAlign: "right", fontWeight: 600, color: "var(--ink-700)", background: "oklch(0.985 0.008 245)" }}>Total del período ({filtered.length} cobros)</td>
                <td style={{ ...S.td, textAlign: "right", fontFamily: mono, fontWeight: 700, fontSize: 15, background: "oklch(0.985 0.008 245)" }}>{fmtPeso(total)}</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

function Kpi({ l, n, sub, small }: { l: string; n: string; sub: string; small?: boolean }) {
  return (
    <div style={S.kpi}>
      <div style={S.kpiL}>{l}</div>
      <div style={{ ...S.kpiN, ...(small ? { fontSize: 17, fontFamily: "'DM Sans', sans-serif", marginTop: 8 } : {}) }}>{n}</div>
      <div style={S.kpiSub}>{sub}</div>
    </div>
  );
}
function Vacio({ texto }: { texto: string }) {
  return <div style={{ padding: "60px 0", textAlign: "center", color: "var(--ink-500)", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, fontSize: 14 }}>{texto}</div>;
}

const mono = "'JetBrains Mono', monospace";

const S: Record<string, CSSProperties> = {
  hero: { padding: "32px 0 12px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },
  tabs: { display: "flex", gap: 4, borderBottom: "1px solid var(--line)", marginTop: 8, overflowX: "auto", overflowY: "hidden" },
  shell: { margin: "20px 0 60px" },
  kpis: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 18 },
  kpi: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" },
  kpiL: { fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500 },
  kpiN: { fontSize: 24, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4, fontFamily: mono },
  kpiSub: { fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 },
  toolbar: { display: "flex", alignItems: "center", gap: 10, padding: "12px 18px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, marginBottom: 14, flexWrap: "wrap" },
  toolL: { fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)" },
  toolDate: { display: "flex", alignItems: "center", gap: 8, border: "1.5px solid var(--line)", borderRadius: 9, padding: "0 12px", height: 38, fontSize: 13.5, background: "var(--paper)" },
  toolInput: { border: 0, outline: 0, background: "transparent", fontSize: 13, color: "var(--ink-900)" },
  dateField: { display: "flex", gap: 10, alignItems: "center", border: "1.5px solid var(--line)", borderRadius: 10, padding: "0 12px", height: 46 },
  exportBtn: { marginLeft: "auto", height: 40, padding: "0 16px", borderRadius: 10, background: "linear-gradient(180deg, var(--ok-500), var(--ok-700))", color: "white", border: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, boxShadow: "0 6px 16px -6px oklch(0.42 0.10 158 / 0.5)" },
  coSection: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", marginBottom: 16, overflow: "hidden" },
  coHead: { padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, background: "oklch(0.985 0.008 245)" },
  coName: { display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 600, fontSize: 15, color: "var(--ink-900)" },
  coMeta: { fontSize: 12, color: "var(--ink-500)", marginLeft: 6, fontWeight: 400 },
  coAmt: { fontFamily: mono, fontSize: 17, fontWeight: 600, color: "var(--ink-900)" },
  bars: { padding: "12px 18px 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 },
  bar: { background: "oklch(0.985 0.008 245)", border: "1px solid var(--line-2)", borderRadius: 10, padding: "10px 12px" },
  barL: { display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 },
  barName: { fontSize: 12, fontWeight: 500, color: "var(--ink-700)" },
  barAmt: { fontFamily: mono, fontSize: 13, fontWeight: 600, color: "var(--ink-900)" },
  barTrack: { marginTop: 8, height: 6, borderRadius: 4, background: "oklch(0.92 0.015 245)", overflow: "hidden" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 13.5 },
  th: { textAlign: "left", padding: "10px 18px", fontSize: 11, fontWeight: 500, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", borderTop: "1px solid var(--line-2)", borderBottom: "1px solid var(--line-2)", background: "var(--paper)", whiteSpace: "nowrap" },
  td: { padding: "11px 18px", borderBottom: "1px solid var(--line-2)", color: "var(--ink-900)" },
  grandTotal: { marginTop: 18, padding: "22px 26px", background: "linear-gradient(135deg, var(--navy-950), var(--navy-800))", color: "white", borderRadius: 18, display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "center", boxShadow: "var(--shadow)" },
  gtL: { fontSize: 12, color: "oklch(0.85 0.04 240)", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 },
  gtN: { fontFamily: mono, fontSize: 38, fontWeight: 600, letterSpacing: "-0.025em", marginTop: 4 },
  gtSub: { fontSize: 13, color: "oklch(0.85 0.04 240)", marginTop: 6 },
  gtRight: { textAlign: "right", display: "flex", flexDirection: "column", gap: 6 },
  gtChip: { display: "inline-flex", alignItems: "center", justifyContent: "flex-end", gap: 8, padding: "4px 0", fontSize: 12.5, color: "oklch(0.92 0.04 240)" },
  gtChipN: { fontFamily: mono, fontWeight: 600, color: "white" },
  renShell: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 22 },
  renCard: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" },
  renHead: { padding: "20px 24px", borderBottom: "1px solid var(--line-2)" },
  renKicker: { fontSize: 11.5, fontWeight: 600, color: "var(--blue-600)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 },
  renTitle: { margin: 0, fontSize: 19, letterSpacing: "-0.02em", fontWeight: 600 },
  renSub: { margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13.5 },
  renBody: { padding: "20px 24px" },
  renPreviewBox: { background: "linear-gradient(135deg, var(--navy-950), var(--navy-800))", color: "white", borderRadius: 14, padding: "20px 22px", marginTop: 14 },
  rpL: { fontSize: 11, color: "oklch(0.85 0.04 240)", letterSpacing: "0.10em", textTransform: "uppercase", fontWeight: 600 },
  rpRow: { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13, color: "oklch(0.92 0.04 240)" },
  rpV: { fontFamily: mono, color: "white", fontWeight: 500 },
  rpTotalRow: { display: "flex", justifyContent: "space-between", paddingTop: 12, marginTop: 10, borderTop: "1px solid oklch(1 0 0 / 0.15)", fontSize: 18, color: "white", fontWeight: 600 },
  rpTotal: { fontFamily: mono, fontSize: 26, letterSpacing: "-0.02em" },
};

const F = {
  tab: (active: boolean): CSSProperties => ({ padding: "12px 18px", borderTop: 0, borderLeft: 0, borderRight: 0, borderBottom: "2px solid " + (active ? "var(--navy-900)" : "transparent"), color: active ? "var(--ink-900)" : "var(--ink-500)", background: "transparent", borderRadius: 0, fontSize: 14, fontWeight: 500, cursor: "pointer", marginBottom: -1, display: "inline-flex", alignItems: "center", gap: 8, whiteSpace: "nowrap", flexShrink: 0 }),
  metPill: (m: string): CSSProperties => {
    const pal: Record<string, [string, string]> = {
      "Débito automático": ["oklch(0.95 0.04 240)", "oklch(0.42 0.13 250)"],
      "Tarjeta de crédito": ["oklch(0.96 0.04 80)", "oklch(0.45 0.13 55)"],
      "CBU": ["oklch(0.95 0.04 280)", "oklch(0.40 0.14 280)"],
      "Transferencia bancaria": ["oklch(0.95 0.04 155)", "oklch(0.42 0.10 158)"],
      "Efectivo": ["oklch(0.95 0.03 30)", "oklch(0.45 0.13 30)"],
      "Mercado Pago": ["oklch(0.95 0.05 230)", "oklch(0.40 0.14 250)"],
    };
    const [bg, fg] = pal[m] ?? ["oklch(0.95 0.012 245)", "var(--ink-700)"];
    return { display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 500, background: bg, color: fg };
  },
};
