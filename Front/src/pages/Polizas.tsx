import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { usePolizas, useCompanias } from "../hooks/polizas";
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

  useEffect(() => { setPage(1); }, [estado]);

  const { data, isLoading, isError, isFetching } = usePolizas(estado, page, PAGE_SIZE);
  const companias = useCompanias();
  const mapCia = new Map((companias.data ?? []).map((c) => [c.id, c.nombre]));

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
        </div>

        <div style={{ opacity: isFetching ? 0.7 : 1, transition: "opacity .15s" }}>
          {isLoading ? <Cargando /> : isError ? <ErrorState /> :
            !data || data.items.length === 0 ? <VacioState mensaje="No hay pólizas para este filtro." /> : (
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
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((p) => (
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
