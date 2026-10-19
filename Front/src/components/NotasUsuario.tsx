import { useState, type CSSProperties } from "react";
import { useNotas, useCrearNota, useEliminarNota } from "../hooks/notas";
import { useIsMobile } from "../hooks/useMediaQuery";
import { IconNote, IconTrash } from "./Icons";
import { formatFechaHora } from "../utils/format";

/**
 * Notas/recordatorios privados del usuario autenticado.
 * El backend filtra siempre por el UsuarioId del token: nadie ve notas ajenas.
 */
export default function NotasUsuario() {
  const mobile = useIsMobile();
  const { data: notas = [], isLoading, isError } = useNotas();
  const crear = useCrearNota();
  const eliminar = useEliminarNota();

  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string>();

  async function agregar() {
    const limpio = texto.trim();
    setError(undefined);
    if (!limpio) {
      setError("Escribí una nota.");
      return;
    }
    try {
      await crear.mutateAsync(limpio);
      setTexto("");
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo guardar la nota.");
    }
  }

  async function borrar(id: number) {
    setError(undefined);
    try {
      await eliminar.mutateAsync(id);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo eliminar la nota.");
    }
  }

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => { setAbierto((v) => !v); setError(undefined); }}
        title="Notas privadas"
        aria-label="Notas privadas"
        style={iconButton}
      >
        <IconNote size={18} />
        {notas.length > 0 && (
          <span style={badge}>{notas.length > 99 ? "99+" : notas.length}</span>
        )}
      </button>

      {abierto && (
        <>
          <div onClick={() => setAbierto(false)} style={{ position: "fixed", inset: 0, zIndex: 30 }} />
          <div style={panelStyle(mobile)}>
            <div style={head}>
              <span>Notas</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "var(--ink-500)" }}>Privadas</span>
            </div>

            <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line-2)" }}>
              <textarea
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                    e.preventDefault();
                    void agregar();
                  }
                }}
                rows={3}
                maxLength={1000}
                autoFocus
                placeholder="Escribí una nota o recordatorio…"
                style={textarea}
              />
              {error && (
                <div style={{ marginTop: 8, fontSize: 12.5, color: "var(--bad-700)" }}>{error}</div>
              )}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-400)" }}>{texto.length}/1000</span>
                <button
                  onClick={() => void agregar()}
                  disabled={crear.isPending || !texto.trim()}
                  style={addButton(crear.isPending || !texto.trim())}
                >
                  {crear.isPending ? "Guardando…" : "Agregar nota"}
                </button>
              </div>
            </div>

            <div style={{ maxHeight: 300, overflowY: "auto" }}>
              {isLoading ? (
                <div style={vacio}>Cargando…</div>
              ) : isError ? (
                <div style={{ ...vacio, color: "var(--bad-700)" }}>No se pudieron cargar las notas.</div>
              ) : notas.length === 0 ? (
                <div style={vacio}>Sin notas.</div>
              ) : (
                notas.map((n) => (
                  <div key={n.id} style={fila}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={textoNota}>{n.texto}</div>
                      <div style={fechaNota}>{formatFechaHora(n.fechaCreacion)}</div>
                    </div>
                    <button
                      onClick={() => void borrar(n.id)}
                      title="Eliminar nota"
                      aria-label="Eliminar nota"
                      style={deleteButton}
                    >
                      <IconTrash size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

const iconButton: CSSProperties = {
  position: "relative", width: 40, height: 40, borderRadius: 10, border: 0,
  background: "transparent", cursor: "pointer", display: "grid", placeItems: "center",
  color: "oklch(0.85 0.04 240)", flexShrink: 0,
};
const badge: CSSProperties = {
  position: "absolute", top: 4, right: 4, minWidth: 16, height: 16, padding: "0 4px",
  borderRadius: 999, background: "var(--blue-500)", color: "white", fontSize: 10, fontWeight: 700,
  display: "grid", placeItems: "center", border: "2px solid var(--navy-950)",
};
function panelStyle(mobile: boolean): CSSProperties {
  return mobile
    ? { position: "fixed", top: 70, left: 12, right: 12, width: "auto", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 31, overflow: "hidden" }
    : { position: "absolute", top: 44, right: 0, width: 340, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 12, boxShadow: "var(--shadow-lg)", zIndex: 31, overflow: "hidden" };
}
const head: CSSProperties = {
  padding: "12px 16px", borderBottom: "1px solid var(--line)", fontWeight: 600, fontSize: 14,
  display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--ink-900)",
};
const textarea: CSSProperties = {
  width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 72, maxHeight: 160,
  padding: "9px 11px", borderRadius: 9, border: "1.5px solid var(--line)", outline: 0,
  fontFamily: "inherit", fontSize: 13.5, color: "var(--ink-900)", background: "var(--paper)",
};
function addButton(disabled: boolean): CSSProperties {
  return {
    height: 32, padding: "0 12px", borderRadius: 8, border: 0,
    background: disabled ? "var(--ink-400)" : "var(--navy-900)", color: "white",
    fontSize: 12.5, fontWeight: 600, cursor: disabled ? "default" : "pointer",
  };
}
const vacio: CSSProperties = { padding: "16px", color: "var(--ink-900)", fontSize: 13.5, textAlign: "center" };
const fila: CSSProperties = { padding: "10px 16px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "flex-start", gap: 10 };
const textoNota: CSSProperties = { fontSize: 13.5, color: "var(--ink-900)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.35 };
const fechaNota: CSSProperties = { fontSize: 11.5, color: "var(--ink-500)", marginTop: 4 };
const deleteButton: CSSProperties = {
  width: 28, height: 28, borderRadius: 7, border: "1px solid oklch(0.85 0.08 28)",
  background: "var(--bad-100)", color: "var(--bad-700)", cursor: "pointer",
  display: "grid", placeItems: "center", flexShrink: 0,
};
