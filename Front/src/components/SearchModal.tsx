import { useEffect, useState, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { buscarGlobal, type ResultadoBusqueda, type TipoResultado } from "../api/search";
import { useDebounce } from "../hooks/useDebounce";
import { IconSearch, IconUser, IconCar, IconFile } from "./Icons";

const ICONO: Record<TipoResultado, () => JSX.Element> = {
  Cliente: () => <IconUser size={16} />,
  Vehiculo: () => <IconCar size={16} />,
  Poliza: () => <IconFile size={16} />,
};

export default function SearchModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const qd = useDebounce(q, 250);
  const { data, isFetching } = useQuery({
    queryKey: ["search", qd],
    queryFn: () => buscarGlobal(qd),
    enabled: qd.trim().length > 0,
  });

  function ir(r: ResultadoBusqueda) {
    if (r.tipo === "Poliza") navigate(`/polizas/${r.referencia}`);
    else navigate(`/clientes/${r.referencia}`);
    onClose();
  }

  const resultados = data ?? [];

  // Cerrar con Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "oklch(0.2 0.02 250 / 0.4)", display: "grid", placeItems: "start center", zIndex: 60, paddingTop: "clamp(16px, 9vh, 90px)", paddingLeft: 16, paddingRight: 16 }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 560, maxHeight: "calc(100vh - clamp(32px, 18vh, 120px))", display: "flex", flexDirection: "column", background: "var(--paper)", borderRadius: 14, boxShadow: "var(--shadow-lg)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--line)" }}>
          <IconSearch size={18} style={{ color: "var(--ink-400)" }} />
          <input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar cliente, patente o número de póliza…"
            style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 15.5 }}
          />
          <kbd className="mono" style={{ fontSize: 11, color: "var(--ink-400)", border: "1px solid var(--line)", borderRadius: 6, padding: "2px 6px" }}>Esc</kbd>
        </div>

        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {qd.trim().length === 0 ? (
            <Vacio texto="Escribí para buscar en clientes, vehículos y pólizas." />
          ) : isFetching && resultados.length === 0 ? (
            <Vacio texto="Buscando…" />
          ) : resultados.length === 0 ? (
            <Vacio texto="Sin resultados." />
          ) : (
            resultados.map((r) => (
              <button key={`${r.tipo}-${r.id}`} onClick={() => ir(r)} style={fila}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--blue-50)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
                <span style={{ color: "var(--ink-400)", display: "grid", placeItems: "center", width: 28 }}>{ICONO[r.tipo]()}</span>
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{r.titulo}</span>
                  <span className="mono" style={{ color: "var(--ink-400)", fontSize: 12.5, marginLeft: 8 }}>{r.subtitulo}</span>
                </span>
                <span style={{ fontSize: 11, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.04em" }}>{r.tipo}</span>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function Vacio({ texto }: { texto: string }) {
  return <div style={{ padding: "28px 20px", textAlign: "center", color: "var(--ink-400)", fontSize: 14 }}>{texto}</div>;
}

const fila: CSSProperties = {
  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
  padding: "11px 18px", border: 0, borderBottom: "1px solid var(--line-2)", background: "transparent", cursor: "pointer",
};
