import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { usePolizas, useCompanias } from "../hooks/polizas";
import { exportarPolizaPdf } from "../api/polizas";
import { IconDownload, IconSearch } from "../components/Icons";
import PageHeader from "../components/ui/PageHeader";
import Pagination from "../components/ui/Pagination";
import { EstadoPolizaBadge, Plate } from "../components/ui/Badge";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import { formatFecha, formatMoneda } from "../utils/format";
import { companiaColor } from "../utils/companiaColor";

const PAGE_SIZE = 20;

const FILTROS: { label: string; estado: number | undefined }[] = [
  { label: "Todas", estado: undefined },
  { label: "Activas", estado: 0 },
  { label: "Vencidas", estado: 1 },
  { label: "Canceladas", estado: 2 },
  { label: "Renovadas", estado: 3 },
];

export default function Polizas() {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<number | undefined>(undefined);
  const [page, setPage] = useState(1);
  // Buscar por un CAMPO elegido (obligatorio para que la búsqueda sea acertiva).
  const [campo, setCampo] = useState<"" | "numero" | "cliente" | "patente">("");
  const [q, setQ] = useState("");
  const [debQ, setDebQ] = useState("");
  const [exportando, setExportando] = useState<number | null>(null);

  // Debounce del texto (no consulta en cada tecla).
  useEffect(() => { const t = setTimeout(() => setDebQ(q), 350); return () => clearTimeout(t); }, [q]);
  useEffect(() => { setPage(1); }, [estado, campo, debQ]);

  // La búsqueda solo corre si se eligió un campo; si no, el listado normal (filtrado por estado).
  const { data, isLoading, isError, isFetching } = usePolizas(
    estado, page, PAGE_SIZE, campo ? debQ : "", campo || undefined);
  const companias = useCompanias();
  const mapCia = new Map((companias.data ?? []).map((c) => [c.id, c.nombre]));

  const items = data?.items ?? [];

  async function abrirExport(id: number) {
    setExportando(id);
    try {
      const blob = await exportarPolizaPdf(id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank"); // se abre en el visor; desde ahí se descarga
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch { /* noop */ } finally { setExportando(null); }
  }

  return (
    <div>
      <PageHeader titulo="Pólizas" subtitulo="Listado de pólizas con filtro por estado." />

      <div style={card}>
        {/* Header con tabs de filtro */}
        <div style={cardHead}>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {FILTROS.map((f) => {
              const activo = f.estado === estado;
              return (
                <button key={f.label} onClick={() => setEstado(f.estado)} style={tab(activo)}>
                  {f.label}
                  {activo && data && <span style={tabCount}>{data.total}</span>}
                </button>
              );
            })}
          </div>
          <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <select value={campo} onChange={(e) => { setCampo(e.target.value as typeof campo); }} style={campoSel}
              title="Elegí un campo para buscar">
              <option value="">Buscar por… *</option>
              <option value="numero">Número</option>
              <option value="cliente">Cliente</option>
              <option value="patente">Patente</option>
            </select>
            <div style={{ ...buscador, opacity: campo ? 1 : 0.55 }}>
              <IconSearch size={15} style={{ color: "var(--ink-400)", flexShrink: 0 }} />
              <input value={q} onChange={(e) => setQ(e.target.value)} disabled={!campo}
                placeholder={campo ? `Buscar por ${campo}…` : "Elegí un campo primero"}
                style={{ border: 0, outline: 0, background: "transparent", fontSize: 13.5, width: "100%", color: "var(--ink-900)" }} />
            </div>
          </div>
        </div>

        <div style={{ opacity: isFetching ? 0.7 : 1, transition: "opacity .15s" }}>
          {isLoading ? <Cargando /> : isError ? <ErrorState /> :
            !data || items.length === 0 ? <VacioState mensaje="No hay pólizas para este filtro." /> : (
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={th}>Número</th>
                    <th style={th}>Cliente</th>
                    <th style={th}>Ramo</th>
                    <th style={th}>Compañía</th>
                    <th style={th}>Patente</th>
                    <th style={th}>Vigencia</th>
                    <th style={th}>Prima</th>
                    <th style={th}>Estado</th>
                    <th style={th}>Exportar</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} onClick={() => navigate(`/polizas/${p.id}`)}
                      style={{ cursor: "pointer", borderTop: "1px solid var(--line-2)" }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "oklch(0.985 0.008 245)")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                      <td style={{ ...td, fontWeight: 600 }} className="mono">{p.numero}</td>
                      <td style={td}>{p.clienteNombre ?? "—"}</td>
                      <td style={{ ...td, color: "var(--ink-700)" }}>{p.ramoNombre ?? "—"}</td>
                      <td style={td}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 9 }}>
                          <span style={{ width: 10, height: 10, borderRadius: 3, background: companiaColor(p.companiaId), flexShrink: 0 }} />
                          {mapCia.get(p.companiaId) ?? "—"}
                        </span>
                      </td>
                      <td style={td}><Plate patente={p.patente} /></td>
                      <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(p.fechaInicio)} – {formatFecha(p.fechaFin)}</td>
                      <td style={td}>{formatMoneda(p.precioTotal)}</td>
                      <td style={td}><EstadoPolizaBadge estado={p.estado} /></td>
                      <td style={td} onClick={(e) => e.stopPropagation()}>
                        <button onClick={() => abrirExport(p.id)} disabled={exportando === p.id} style={exportBtn}
                          title="Exportar cliente + póliza + vehículo">
                          <IconDownload size={14} /> {exportando === p.id ? "…" : "Exportar"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
        </div>
      </div>

      {data && data.items.length > 0 && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
      )}
    </div>
  );
}

const card: CSSProperties = {
  background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16,
  overflow: "hidden", boxShadow: "var(--shadow-sm)",
};
const cardHead: CSSProperties = {
  padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, borderBottom: "1px solid var(--line-2)",
};
function tab(active: boolean): CSSProperties {
  return {
    padding: "6px 12px", borderRadius: 8, fontSize: 13.5, fontWeight: 500, cursor: "pointer", border: 0,
    color: active ? "var(--navy-900)" : "var(--ink-500)",
    background: active ? "var(--blue-100)" : "transparent",
    display: "inline-flex", alignItems: "center", gap: 7,
  };
}
const tabCount: CSSProperties = {
  fontSize: 11, padding: "1px 7px", borderRadius: 999, background: "white", color: "var(--navy-900)", fontWeight: 600,
};
const th: CSSProperties = {
  textAlign: "left", padding: "12px 18px", fontSize: 12, fontWeight: 500, textTransform: "uppercase",
  letterSpacing: "0.06em", color: "var(--ink-500)", background: "oklch(0.985 0.008 245)", borderBottom: "1px solid var(--line-2)", whiteSpace: "nowrap",
};
const td: CSSProperties = { padding: "14px 18px", fontSize: 14, verticalAlign: "middle" };
const buscador: CSSProperties = {
  display: "flex", alignItems: "center", gap: 8, minWidth: 220, maxWidth: 320, flex: "0 1 300px",
  border: "1px solid var(--line)", borderRadius: 9, padding: "0 12px", height: 36, background: "var(--paper)",
};
const campoSel: CSSProperties = {
  height: 36, borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)",
  color: "var(--ink-700)", fontSize: 13.5, padding: "0 10px", cursor: "pointer",
};
const exportBtn: CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 6, border: "1px solid var(--line)", borderRadius: 8,
  background: "var(--paper)", color: "var(--ink-700)", cursor: "pointer", fontSize: 12.5, fontWeight: 500, padding: "6px 10px",
};
