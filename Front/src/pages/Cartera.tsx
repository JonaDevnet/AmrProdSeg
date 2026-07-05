// Portado de disenioAMR/amr_dashboard.jsx — "Cartera de clientes".
// Adaptado a la estructura del proyecto: datos reales (usePolizas/useCompanias),
// navegación con react-router. El diseño (hero, stats, tabla, tabs, chips, pager,
// pills, plates, dots de compañía) se mantiene idéntico al prototipo.
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePolizas, useCompanias } from "../hooks/polizas";
import { asignarNumeroPoliza } from "../api/polizas";
import type { Poliza } from "../types";
import {
  IconPlus, IconShield, IconCal, IconChevD, IconChevL, IconChevR, IconDots, IconDown, IconCheck,
} from "../design/icons";
import { coColor } from "../design/companias";
import { estadoPolizaUI } from "../utils/poliza";
import { descargarCSV } from "../utils/csv";
import FichaModal from "../components/FichaModal";
import { useAuth } from "../auth/AuthContext";
import { useUsuarios } from "../hooks/admin";
import { carteraExport } from "../api/reportes";
import { solicitarEliminarPoliza } from "../api/eliminaciones";
import { useIsMobile } from "../hooks/useMediaQuery";
import type { Usuario } from "../types";

const PER_PAGE = 8;
const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
const normStr = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Est = "vigente" | "porvencer" | "vencida";
type Orden = "venc" | "nombre" | "compania" | "estado";
const ORDEN_LABEL: Record<Orden, string> = { venc: "Vencimiento", nombre: "Nombre", compania: "Compañía", estado: "Estado" };
const PESO_EST: Record<Est, number> = { vencida: 0, porvencer: 1, vigente: 2 };

interface Row {
  id: number;
  coIdx: number;
  coName: string;
  coColorHex: string;
  pol: string;
  cli: string;
  pat: string;
  est: Est;
  ven: string;
  venIso: string;
  ramo: string;
}

function fmtFecha(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}

function mapEstado(p: Poliza): Est | null {
  return estadoPolizaUI(p.estado, p.fechaFin);
}

export default function Cartera() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const qc = useQueryClient();
  const { esAdmin } = useAuth();
  const [asignar, setAsignar] = useState<Row | null>(null);
  const [ficha, setFicha] = useState<number | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [aviso, setAviso] = useState("");
  const [eliminar, setEliminar] = useState<Row | null>(null);
  const [elimMotivo, setElimMotivo] = useState("");
  const [elimAviso, setElimAviso] = useState("");
  const [eliminando, setEliminando] = useState(false);
  const [tab, setTab] = useState<"todas" | Est>("todas");
  const [search, setSearch] = useState("");
  const [ramo, setRamo] = useState("todos");
  const [orden, setOrden] = useState<Orden>("venc");
  const [ordenAbierto, setOrdenAbierto] = useState(false);
  const [page, setPage] = useState(1);
  const [hover, setHover] = useState<number | null>(null);

  const { data: companias = [] } = useCompanias();
  const { data: pageData, isLoading, isError } = usePolizas(undefined, 1, 10000);

  const rows: Row[] = useMemo(() => {
    const items = pageData?.items ?? [];
    return items
      .map((p) => {
        const est = mapEstado(p);
        if (!est) return null;
        const coIdx = companias.findIndex((c) => c.id === p.companiaId);
        return {
          id: p.id,
          coIdx: coIdx < 0 ? 0 : coIdx,
          coName: companias[coIdx]?.nombre ?? "—",
          coColorHex: companias[coIdx]?.color || coColor(coIdx < 0 ? 0 : coIdx),
          pol: p.numero,
          cli: p.clienteNombre ?? "—",
          pat: p.patente && p.patente.trim() ? p.patente : "—",
          est,
          ven: fmtFecha(p.fechaFin),
          venIso: p.fechaFin ?? "",
          ramo: p.ramoNombre ?? "—",
        } as Row;
      })
      .filter((r): r is Row => r !== null);
  }, [pageData, companias]);

  const ramos = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => r.ramo !== "—" && set.add(r.ramo));
    return ["todos", ...Array.from(set).sort()];
  }, [rows]);

  const tabCounts = useMemo(() => ({
    todas: rows.length,
    vigente: rows.filter((r) => r.est === "vigente").length,
    porvencer: rows.filter((r) => r.est === "porvencer").length,
    vencida: rows.filter((r) => r.est === "vencida").length,
  }), [rows]);

  const filtered = rows.filter((r) => {
    if (tab !== "todas" && r.est !== tab) return false;
    if (ramo !== "todos" && r.ramo !== ramo) return false;
    if (search.trim()) {
      const q = normStr(search);
      if (!normStr(r.cli).includes(q) && !normStr(r.pol).includes(q)
        && !normStr(r.pat).includes(q) && !normStr(r.coName).includes(q)) return false;
    }
    return true;
  });

  const ordenado = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      switch (orden) {
        case "nombre": return a.cli.localeCompare(b.cli, "es");
        case "compania": return a.coName.localeCompare(b.coName, "es");
        case "estado": return PESO_EST[a.est] - PESO_EST[b.est];
        default: return a.venIso.localeCompare(b.venIso); // vencimiento ascendente
      }
    });
    return arr;
  }, [filtered, orden]);

  const totalPages = Math.max(1, Math.ceil(ordenado.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PER_PAGE;
  const paged = ordenado.slice(pageStart, pageStart + PER_PAGE);

  useEffect(() => { setPage(1); }, [tab, ramo, search, orden]);

  const pageList = useMemo(() => {
    const out: (number | "…")[] = [];
    const add = (p: number) => { if (!out.includes(p) && p >= 1 && p <= totalPages) out.push(p); };
    if (totalPages <= 7) { for (let p = 1; p <= totalPages; p++) out.push(p); return out; }
    add(1);
    if (safePage > 3) out.push("…");
    add(safePage - 1); add(safePage); add(safePage + 1);
    if (safePage < totalPages - 2) out.push("…");
    add(totalPages);
    return out;
  }, [totalPages, safePage]);


  return (
    <div>
      {/* HERO */}
      <div style={S.hero}>
        <div>
          <div style={S.crumb}>Inicio · Cartera</div>
          <h1 style={S.h1}>Cartera de clientes</h1>
          <p style={S.sub}>
            {filtered.length} de {rows.length} pólizas
          </p>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {esAdmin && (
            <button style={{ ...S.toolBtn, height: 40 }} onClick={() => setExportOpen(true)}><IconDown size={15} /> Exportar</button>
          )}
          <button style={S.primaryBtn} onClick={() => navigate("/alta")}>
            <IconPlus size={16} /> Nueva póliza
          </button>
        </div>
      </div>

      {/* STATS */}
      <section style={S.stats}>
        <StatCard label="Pólizas vigentes" n={String(tabCounts.vigente)} icon={<IconShield size={14} />} />
        <StatCard label="Por vencer (10 días)" n={String(tabCounts.porvencer)} warn icon={<IconCal size={14} />} />
        <StatCard label="Vencidas" n={String(tabCounts.vencida)} />
        <StatCard label="Total cartera" n={String(rows.length)} />
      </section>

      {/* TABLE CARD */}
      <section style={S.card}>
        <div style={{ ...S.cardHead, ...(mobile ? { flexDirection: "column", alignItems: "stretch", gap: 10 } : null) }}>
          <div style={S.cardTitle}>Pólizas</div>
          <div style={{ ...S.tabs, ...(mobile ? { marginLeft: 0, overflowX: "auto", paddingBottom: 2 } : null) }}>
            {([["todas", "Todas"], ["vigente", "Vigentes"], ["porvencer", "Por vencer"], ["vencida", "Vencidas"]] as const).map(([k, l]) => (
              <button key={k} style={{ ...F.tab(tab === k), whiteSpace: "nowrap", flexShrink: 0 }} onClick={() => setTab(k)}>
                {l} <span style={F.tabCount(tab === k)}>{tabCounts[k as keyof typeof tabCounts]}</span>
              </button>
            ))}
          </div>
          <div style={{ ...S.toolbar, ...(mobile ? { marginLeft: 0, width: "100%" } : null) }}>
            <div style={{ position: "relative", ...(mobile ? { width: "100%" } : null) }}>
              <button style={{ ...S.toolBtn, ...(mobile ? { width: "100%", justifyContent: "space-between" } : null) }} onClick={() => setOrdenAbierto((o) => !o)}>
                Ordenar por: {ORDEN_LABEL[orden]} <IconChevD size={13} />
              </button>
              {ordenAbierto && (
                <>
                  <div onClick={() => setOrdenAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 20 }} />
                  <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 21, minWidth: 180 }}>
                    {(Object.keys(ORDEN_LABEL) as Orden[]).map((k) => (
                      <button key={k} onClick={() => { setOrden(k); setOrdenAbierto(false); }}
                        style={{ width: "100%", textAlign: "left", padding: "9px 12px", borderRadius: 7, border: 0, background: orden === k ? "var(--blue-100)" : "transparent", color: "var(--ink-900)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        {ORDEN_LABEL[k]} {orden === k && <IconCheck size={14} style={{ color: "var(--blue-600)" }} />}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={S.filterChips}>
          <span style={{ fontSize: 12, color: "var(--ink-500)", marginRight: 4 }}>Ramo:</span>
          {ramos.map((r) => (
            <button key={r} style={F.chip(ramo === r)} onClick={() => setRamo(r)}>
              {r === "todos" ? "Todos los ramos" : r}
            </button>
          ))}
        </div>

        {/* Barra de búsqueda local */}
        <div style={{ padding: "12px 22px", borderBottom: "1px solid var(--line-2)" }}>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por cliente, póliza, patente o compañía…"
            style={{
              width: "100%", height: 38, borderRadius: 9, border: "1px solid var(--line)",
              padding: "0 12px", fontSize: 13.5, outline: "none", background: "var(--paper)", color: "var(--ink-900)",
            }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={S.table}>
            <thead>
              <tr>
                <th style={S.th}>Compañía</th>
                <th style={S.th}>Póliza</th>
                <th style={S.th}>Nombre</th>
                <th style={S.th}>Patente</th>
                <th style={S.th}>Vencimiento</th>
                <th style={S.th}>Estado</th>
                <th style={{ ...S.th, width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: "60px 0", color: "var(--ink-500)" }}>Cargando…</td></tr>
              ) : isError ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: "60px 0", color: "var(--bad-700)" }}>No se pudieron cargar las pólizas.</td></tr>
              ) : paged.map((r, i) => {
                const hovered = hover === i;
                return (
                  <tr key={r.id} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
                      style={hovered ? S.rowHover : undefined}>
                    <td style={S.td}>
                      <div style={S.coTag}>
                        <span style={F.coDot(r.coColorHex)} />
                        {r.coName}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2, marginLeft: 19 }}>{r.ramo}</div>
                    </td>
                    <td style={S.td}>
                      <span className="mono" style={{ fontSize: 13.5, fontWeight: 500 }}>{r.pol}</span>
                      {r.pol.startsWith("E/T") && (
                        <span style={{ marginLeft: 8, fontSize: 10.5, fontWeight: 700, color: "oklch(0.45 0.13 70)", background: "oklch(0.95 0.05 80)", border: "1px solid oklch(0.85 0.08 80)", padding: "1px 6px", borderRadius: 999 }}>EN TRÁMITE</span>
                      )}
                    </td>
                    <td style={S.td}><div style={{ fontWeight: 500 }}>{r.cli}</div></td>
                    <td style={S.td}>{r.pat === "—" ? <span style={S.plateNone}>—</span> : <span style={S.plate}>{r.pat}</span>}</td>
                    <td style={{ ...S.td, color: "var(--ink-700)", fontSize: 13.5 }}>{r.ven}</td>
                    <td style={S.td}>
                      <span style={F.pill(r.est)}>
                        <span style={F.pillDot(r.est)} />
                        {r.est === "vigente" ? "Vigente" : r.est === "porvencer" ? "Por vencer" : "Vencida"}
                      </span>
                    </td>
                    <td style={S.td}>
                      <RowMenu
                        esET={r.pol.startsWith("E/T")}
                        esAdmin={esAdmin}
                        onVerFicha={() => setFicha(r.id)}
                        onEditar={() => setAsignar(r)}
                        onCobrar={() => navigate(`/cobranzas?poliza=${r.id}`)}
                        onEliminar={() => { setEliminar(r); setElimAviso(""); }}
                      />
                    </td>
                  </tr>
                );
              })}
              {!isLoading && !isError && filtered.length === 0 && (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", padding: "60px 0", color: "var(--ink-500)" }}>
                  No se encontraron pólizas con esos criterios.
                </td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div style={S.cardFoot}>
          <div>
            {filtered.length === 0 ? <>Sin resultados para los filtros actuales</> : (
              <>Mostrando <strong style={{ color: "var(--ink-900)" }}>{pageStart + 1}–{Math.min(pageStart + PER_PAGE, filtered.length)}</strong> de{" "}
                <strong style={{ color: "var(--ink-900)" }}>{filtered.length}</strong> resultados</>
            )}
          </div>
          <div style={S.pager}>
            <button style={F.pageBtn(false, safePage === 1)} disabled={safePage === 1} onClick={() => setPage((p) => Math.max(1, p - 1))}><IconChevL size={14} /></button>
            {pageList.map((p, idx) => p === "…"
              ? <span key={"e" + idx} style={{ padding: "0 6px", color: "var(--ink-400)" }}>…</span>
              : <button key={p} style={F.pageBtn(p === safePage, false)} onClick={() => setPage(p)}>{p}</button>)}
            <button style={F.pageBtn(false, safePage === totalPages)} disabled={safePage === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}><IconChevR size={14} /></button>
          </div>
        </div>
      </section>

      {asignar && (
        <AsignarNumeroModal
          row={asignar}
          onClose={() => setAsignar(null)}
          onSaved={() => {
            setAsignar(null);
            qc.invalidateQueries({ queryKey: ["polizas"] });
            setAviso("Número de póliza asignado");
            setTimeout(() => setAviso(""), 3500);
          }}
        />
      )}

      {aviso && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--navy-900)", color: "white", padding: "13px 20px", borderRadius: 12, boxShadow: "var(--shadow-lg)", fontSize: 13.5, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 8 }}>
          <IconCheck size={15} /> {aviso}
        </div>
      )}

      {ficha != null && <FichaModal polizaId={ficha} onClose={() => setFicha(null)} />}
      {exportOpen && <ExportarModal onClose={() => setExportOpen(false)} />}

      {eliminar && (
        <div onClick={() => !eliminando && setEliminar(null)} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(4px)", zIndex: 1100, display: "grid", placeItems: "center", padding: 20 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: 460, maxWidth: "100%", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 24 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: "var(--bad-700)" }}>
              {esAdmin ? "Eliminar póliza" : "Solicitar eliminación"}
            </h3>
            <p style={{ margin: "10px 0 0", fontSize: 13.5, color: "var(--ink-700)", lineHeight: 1.5 }}>
              {esAdmin
                ? <>Se enviará <strong className="mono">{eliminar.pol}</strong> a la <strong>papelera</strong> (desaparece de la cartera, con sus cuotas). El cliente <strong>{eliminar.cli}</strong> se conserva. Podés <strong>restaurarla</strong> desde el Registro de movimientos.</>
                : <>Se enviará una solicitud para eliminar <strong className="mono">{eliminar.pol}</strong> ({eliminar.cli}). Un administrador debe autorizarla.</>}
            </p>

            <div style={{ marginTop: 16 }}>
              <label style={{ display: "block", fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 6 }}>Motivo {esAdmin ? "(opcional)" : ""}</label>
              <textarea value={elimMotivo} onChange={(e) => setElimMotivo(e.target.value)} rows={2}
                placeholder="Ej.: cargada por error, póliza duplicada…"
                style={{ width: "100%", border: "1px solid var(--line)", borderRadius: 9, padding: "9px 12px", fontSize: 13.5, resize: "vertical", outline: "none", color: "var(--ink-900)", background: "var(--paper)" }} />
            </div>

            {elimAviso && <div style={{ marginTop: 12, padding: "9px 12px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 12.5, color: "var(--bad-700)" }}>{elimAviso}</div>}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 18 }}>
              <button onClick={() => setEliminar(null)} disabled={eliminando}
                style={{ height: 40, padding: "0 16px", borderRadius: 10, background: "var(--paper)", border: "1.5px solid var(--line)", color: "var(--ink-900)", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancelar</button>
              <button disabled={eliminando} onClick={async () => {
                setEliminando(true); setElimAviso("");
                try {
                  const r = await solicitarEliminarPoliza(eliminar.id, elimMotivo.trim() || undefined);
                  setEliminar(null); setElimMotivo("");
                  qc.invalidateQueries({ queryKey: ["polizas"] });
                  qc.invalidateQueries({ queryKey: ["notif"] });
                  setAviso(r.mensaje);
                  setTimeout(() => setAviso(""), 5000);
                } catch (e: any) {
                  setElimAviso(e?.response?.data?.error ?? "No se pudo procesar la eliminación.");
                } finally { setEliminando(false); }
              }}
                style={{ height: 40, padding: "0 18px", borderRadius: 10, background: "var(--bad-600)", color: "white", border: 0, fontSize: 14, fontWeight: 600, cursor: eliminando ? "wait" : "pointer" }}>
                {eliminando ? "Procesando…" : esAdmin ? "Eliminar definitivamente" : "Enviar solicitud"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ExportarModal({ onClose }: { onClose: () => void }) {
  const usuarios = useUsuarios();
  const [modo, setModo] = useState<"todos" | "vendedor">("todos");
  const [vendedorId, setVendedorId] = useState<number | "">("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  async function exportar() {
    setError("");
    if (modo === "vendedor" && vendedorId === "") { setError("Elegí un vendedor."); return; }
    setCargando(true);
    try {
      const filasDatos = await carteraExport(modo === "vendedor" ? Number(vendedorId) : undefined);
      if (filasDatos.length === 0) { setError("No hay pólizas para exportar con ese criterio."); setCargando(false); return; }
      const filas: (string | number)[][] = [
        ["Próximo vencimiento", "Compañía", "Cuota actual", "Cuotas totales", "Precio cobrado", "Precio total", "Prima OG", "N° póliza",
          "Cliente", "Documento", "Tipo doc", "Email", "Teléfono", "Dirección",
          "Patente", "Marca", "Modelo", "Año", "N° chasis", "N° motor", "Combustión", "Tipo de cobertura"],
        ...filasDatos.map((r) => [
          r.proximoVencimiento ? fmtFecha(r.proximoVencimiento) : "—",
          r.compania, r.cuotaActual, r.cuotasTotal, r.precioCobrado, r.precioTotal, r.primaOG, r.nroPoliza,
          r.clienteNombre, r.documento, r.tipoDocumento, r.email, r.telefono, r.direccion,
          r.patente, r.marca, r.modelo, r.anio, r.chasis, r.motor, r.combustion,
          r.tipoCobertura,
        ]),
      ];
      const nombreVend = modo === "vendedor" ? "-" + (usuarios.data?.find((u) => u.id === vendedorId)?.nombre ?? "vendedor").replace(/\s/g, "_") : "";
      descargarCSV(`AMR-Cartera${nombreVend}-${new Date().toISOString().slice(0, 10)}.csv`, filas);
      onClose();
    } catch {
      setError("No se pudo generar el export.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(4px)", zIndex: 1100, display: "grid", placeItems: "center", padding: 20 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 440, maxWidth: "100%", background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", padding: 24 }}>
        <h3 style={{ margin: "0 0 6px", fontSize: 19, fontWeight: 600, letterSpacing: "-0.02em" }}>Exportar cartera</h3>
        <p style={{ margin: "0 0 18px", color: "var(--ink-500)", fontSize: 13.5 }}>Elegí qué pólizas incluir en la planilla.</p>

        {error && <div style={{ marginBottom: 14, padding: "10px 12px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{error}</div>}

        <label style={optRow(modo === "todos")} onClick={() => setModo("todos")}>
          <input type="radio" checked={modo === "todos"} onChange={() => setModo("todos")} />
          <span><strong>Todos los vendedores</strong><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Toda la cartera activa.</div></span>
        </label>
        <label style={optRow(modo === "vendedor")} onClick={() => setModo("vendedor")}>
          <input type="radio" checked={modo === "vendedor"} onChange={() => setModo("vendedor")} />
          <span style={{ flex: 1 }}><strong>Un vendedor en particular</strong><div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>Sólo las pólizas cargadas por ese usuario.</div></span>
        </label>
        {modo === "vendedor" && (
          <select value={vendedorId} onChange={(e) => setVendedorId(e.target.value === "" ? "" : Number(e.target.value))}
            style={{ width: "100%", height: 40, padding: "0 12px", borderRadius: 10, border: "1.5px solid var(--line)", background: "var(--paper)", fontSize: 14, marginTop: 4, marginBottom: 4 }}>
            <option value="">— Elegí un vendedor —</option>
            {(usuarios.data ?? []).map((u: Usuario) => <option key={u.id} value={u.id}>{u.nombre}{u.rol === "Admin" ? " (Admin)" : ""}</option>)}
          </select>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{ ...S.toolBtn, height: 40 }}>Cancelar</button>
          <button onClick={exportar} disabled={cargando} style={{ ...S.primaryBtn, opacity: cargando ? 0.6 : 1 }}>
            <IconDown size={15} /> {cargando ? "Generando…" : "Exportar"}
          </button>
        </div>
      </div>
    </div>
  );
}

function optRow(active: boolean): CSSProperties {
  return { display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 11, border: "1.5px solid " + (active ? "var(--blue-500)" : "var(--line)"), background: active ? "var(--blue-50)" : "var(--paper)", cursor: "pointer", marginBottom: 10 };
}

function AsignarNumeroModal({ row, onClose, onSaved }: { row: Row; onClose: () => void; onSaved: () => void }) {
  const [val, setVal] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const esET = row.pol.startsWith("E/T");

  async function guardar() {
    const t = val.trim();
    if (!t) { setErr("Ingresá el número de póliza."); return; }
    if (t === row.pol) { setErr("El número es igual al actual."); return; }
    setBusy(true); setErr("");
    try {
      await asignarNumeroPoliza(row.id, t);
      onSaved();
    } catch (e: any) {
      setErr(e?.response?.data?.error ?? "No se pudo asignar el número.");
    } finally { setBusy(false); }
  }

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(5px)", zIndex: 60, display: "grid", placeItems: "center", padding: 24 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: 480, background: "var(--paper)", borderRadius: 16, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ padding: "20px 24px", background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white" }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.65, marginBottom: 5 }}>{esET ? "Asignar número definitivo" : "Editar número de póliza"}</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{row.cli}</div>
          <div className="mono" style={{ fontSize: 12.5, color: "oklch(0.78 0.04 240)", marginTop: 4 }}>Actual: {row.pol}</div>
        </div>
        <div style={{ padding: "22px 24px" }}>
          {esET && (
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, marginBottom: 18, background: "oklch(0.97 0.04 80)", border: "1px solid oklch(0.88 0.08 80)", fontSize: 13, color: "oklch(0.42 0.10 70)" }}>
              Esta póliza está <strong>en trámite (E/T)</strong>. Cuando la compañía emita el número definitivo, ingresalo acá.
            </div>
          )}
          <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 8 }}>Nuevo número de póliza <span style={{ color: "var(--bad-700)" }}>*</span></div>
          <input value={val} onChange={(e) => { setVal(e.target.value.toUpperCase()); setErr(""); }} onKeyDown={(e) => e.key === "Enter" && guardar()} placeholder="AUT-2611-123456" autoFocus
            className="mono"
            style={{ width: "100%", height: 48, borderRadius: 10, border: `1.5px solid ${err ? "var(--bad-500)" : "var(--blue-500)"}`, boxShadow: err ? "0 0 0 4px oklch(0.62 0.16 28 / 0.12)" : "0 0 0 4px oklch(0.62 0.16 243 / 0.12)", padding: "0 14px", fontSize: 15, fontWeight: 600, letterSpacing: "0.04em", color: "var(--ink-900)", outline: "none", boxSizing: "border-box" }} />
          {err && <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--bad-700)" }}>{err}</div>}
        </div>
        <div style={{ padding: "14px 24px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
          <button onClick={guardar} disabled={busy} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "var(--navy-900)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{busy ? "Guardando…" : "Guardar número"}</button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, n, warn, icon }: { label: string; n: string; warn?: boolean; icon?: ReactNode }) {
  return (
    <div style={S.stat}>
      <div style={S.statL}>
        {icon && <span style={{ color: warn ? "var(--warn-700)" : "var(--blue-600)" }}>{icon}</span>}
        {label}
      </div>
      <div><span style={S.statN} className="mono">{n}</span></div>
    </div>
  );
}

function RowMenu({ esET, esAdmin, onVerFicha, onEditar, onCobrar, onEliminar }: { esET?: boolean; esAdmin?: boolean; onVerFicha: () => void; onEditar: () => void; onCobrar: () => void; onEliminar: () => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; right: number }>({ top: 0, right: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Posiciona el menú (fixed) respecto al botón, para que quede FUERA del scroll de la tabla.
  useLayoutEffect(() => {
    if (!open || !btnRef.current) return;
    const r = btnRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 4, right: window.innerWidth - r.right });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (btnRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    window.addEventListener("mousedown", h);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [open]);

  const items = [
    { l: "Cobrar cuota", action: () => { onCobrar(); setOpen(false); }, danger: false },
    { l: "Ver ficha", action: () => { onVerFicha(); setOpen(false); }, danger: false },
    { l: esET ? "Asignar N° de póliza" : "Editar N° de póliza", action: () => { onEditar(); setOpen(false); }, danger: false },
    { l: esAdmin ? "Eliminar póliza" : "Solicitar eliminación", action: () => { onEliminar(); setOpen(false); }, danger: true },
  ];
  return (
    <>
      <button ref={btnRef} onClick={() => setOpen((o) => !o)}
        style={{ width: 30, height: 30, display: "grid", placeItems: "center", borderRadius: 8, border: 0, background: "transparent", color: open ? "var(--ink-700)" : "var(--ink-400)", cursor: "pointer" }}>
        <IconDots size={18} />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: pos.top, right: pos.right, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 1000, minWidth: 210 }}>
          {items.map((item, i) => (
            <button key={i} onClick={item.action}
              style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 7, border: 0, borderTop: item.danger ? "1px solid var(--line-2)" : undefined, marginTop: item.danger ? 4 : 0, background: "transparent", color: item.danger ? "var(--bad-600)" : "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", textAlign: "left" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = item.danger ? "var(--bad-100)" : "var(--blue-50)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              {item.l}
            </button>
          ))}
        </div>,
        document.body,
      )}
    </>
  );
}

const S: Record<string, CSSProperties> = {
  hero: { padding: "32px 0 16px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap" },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  h1: { margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 },
  stats: { padding: "8px 0 0", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 },
  stat: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 14, padding: "16px 18px" },
  statL: { fontSize: 12.5, color: "var(--ink-500)", fontWeight: 500, display: "flex", alignItems: "center", gap: 8 },
  statN: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 6, color: "var(--ink-900)", display: "inline-block" },
  card: { margin: "20px 0 60px", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, overflow: "hidden", boxShadow: "var(--shadow-sm)" },
  cardHead: { padding: "18px 22px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--line-2)", flexWrap: "wrap" },
  cardTitle: { fontWeight: 600, fontSize: 16, letterSpacing: "-0.01em" },
  tabs: { display: "flex", gap: 4, marginLeft: 12 },
  toolbar: { marginLeft: "auto", display: "flex", alignItems: "center", gap: 8 },
  toolBtn: { height: 36, padding: "0 12px", borderRadius: 9, background: "var(--paper)", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 },
  table: { width: "100%", borderCollapse: "collapse", fontSize: 14 },
  th: { textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 500, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", borderBottom: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", whiteSpace: "nowrap", userSelect: "none" },
  td: { padding: "14px 18px", borderBottom: "1px solid var(--line-2)", color: "var(--ink-900)", verticalAlign: "middle" },
  rowHover: { background: "oklch(0.985 0.008 245)" },
  coTag: { display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 500 },
  plate: { display: "inline-flex", alignItems: "center", border: "1.5px solid var(--ink-900)", borderRadius: 5, padding: "3px 9px", fontSize: 12.5, letterSpacing: "0.06em", fontWeight: 600, color: "var(--ink-900)", background: "oklch(0.99 0.005 245)", fontFamily: "'JetBrains Mono', monospace" },
  plateNone: { color: "var(--ink-400)", fontSize: 13 },
  cardFoot: { padding: "14px 22px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", fontSize: 13, color: "var(--ink-500)" },
  pager: { display: "flex", alignItems: "center", gap: 4 },
  primaryBtn: { height: 40, padding: "0 16px", borderRadius: 10, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8 },
  filterChips: { display: "flex", gap: 8, padding: "12px 22px", borderBottom: "1px solid var(--line-2)", background: "var(--paper)", alignItems: "center", flexWrap: "wrap" },
};

const F = {
  tab: (active: boolean): CSSProperties => ({ padding: "6px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, color: active ? "var(--navy-900)" : "var(--ink-500)", background: active ? "var(--blue-100)" : "transparent", border: 0, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 }),
  tabCount: (active: boolean): CSSProperties => ({ fontSize: 11, padding: "1px 7px", borderRadius: 999, background: active ? "white" : "var(--blue-100)", color: active ? "var(--navy-900)" : "var(--ink-500)", fontWeight: 600 }),
  coDot: (c: string): CSSProperties => ({ width: 10, height: 10, borderRadius: 3, background: c, flexShrink: 0 }),
  pill: (kind: Est): CSSProperties => {
    const palette = {
      vigente: { bg: "var(--ok-100)", fg: "var(--ok-700)" },
      porvencer: { bg: "var(--warn-100)", fg: "var(--warn-700)" },
      vencida: { bg: "var(--bad-100)", fg: "var(--bad-700)" },
    }[kind];
    return { display: "inline-flex", alignItems: "center", gap: 7, background: palette.bg, color: palette.fg, padding: "4px 10px 4px 9px", borderRadius: 999, fontSize: 12.5, fontWeight: 600 };
  },
  pillDot: (kind: Est): CSSProperties => ({ width: 7, height: 7, borderRadius: "50%", background: { vigente: "var(--ok-500)", porvencer: "var(--warn-500)", vencida: "var(--bad-500)" }[kind] }),
  pageBtn: (active: boolean, disabled: boolean): CSSProperties => ({ minWidth: 32, height: 32, borderRadius: 7, border: "1px solid " + (active ? "var(--blue-600)" : "transparent"), background: active ? "var(--blue-100)" : "transparent", color: disabled ? "var(--ink-400)" : active ? "var(--navy-900)" : "var(--ink-700)", cursor: disabled ? "not-allowed" : "pointer", fontSize: 13, fontWeight: 500, padding: "0 8px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 4 }),
  chip: (active: boolean): CSSProperties => ({ padding: "5px 11px", borderRadius: 999, fontSize: 12.5, fontWeight: 500, border: "1px solid " + (active ? "var(--navy-900)" : "var(--line)"), background: active ? "var(--navy-900)" : "var(--paper)", color: active ? "white" : "var(--ink-700)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }),
};
