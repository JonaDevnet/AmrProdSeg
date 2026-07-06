// Se muestra tras cobrar una cuota. Imprime el comprobante (1ª hoja, con talón) y el
// ticket (2ª hoja, sin logo) desde el backend, y ofrece envío por Email/WhatsApp.
import { useMemo, useState, type CSSProperties } from "react";
import { Icon, IconCheck, IconMail } from "../../design/icons";
import { enviarComprobante, imprimirComprobante, imprimirTicket, descargarComprobante } from "../../api/cobros";

export interface ComprobanteData {
  cobroId: number;
  cuotaN: number;
  monto: number;
  fecha: string;       // dd/MM/yyyy
  cliente: string;
  poliza: string;
  compania: string;
  ramo: string;
}

const fmt = (n: number) => "$ " + Number(n).toLocaleString("es-AR");

export default function ComprobanteModal({ c, onClose }: { c: ComprobanteData; onClose: () => void }) {
  const numero = useMemo(() => "REC-" + new Date().toISOString().slice(2, 7).replace("-", "") + "-" + Math.floor(100000 + Math.random() * 899999), []);
  const [sent, setSent] = useState<null | "email" | "wa">(null);
  const [enviando, setEnviando] = useState<null | "email" | "wa">(null);
  const [imprimiendo, setImprimiendo] = useState<null | "comprobante" | "ticket">(null);
  const [descargando, setDescargando] = useState(false);
  const [aviso, setAviso] = useState<string>("");

  async function descargar() {
    setDescargando(true); setAviso("");
    try {
      await descargarComprobante(c.cobroId);
    } catch {
      setAviso("No se pudo descargar el comprobante.");
    } finally {
      setDescargando(false);
    }
  }

  async function imprimir(tipo: "comprobante" | "ticket") {
    setImprimiendo(tipo); setAviso("");
    try {
      await (tipo === "ticket" ? imprimirTicket(c.cobroId) : imprimirComprobante(c.cobroId));
    } catch {
      setAviso(`No se pudo generar el ${tipo} para imprimir.`);
    } finally {
      setImprimiendo(null);
    }
  }

  async function enviar(canal: "email" | "wa") {
    setEnviando(canal); setAviso("");
    try {
      const r = await enviarComprobante(c.cobroId, canal === "wa" ? "whatsapp" : "email");
      setSent(canal);
      setAviso(r.mensaje);
    } catch (e: any) {
      setAviso(e?.response?.data?.error ?? "No se pudo enviar el comprobante.");
    } finally {
      setEnviando(null);
    }
  }

  return (
    <div style={back} onClick={onClose}>
      <div style={modal} onClick={(e) => e.stopPropagation()}>
        <div style={recHead}>
          <div style={recIcon}><IconCheck size={30} sw={2.6} /></div>
          <h3 style={recTitle}>Pago registrado</h3>
          <p style={recSub}>Cuota {c.cuotaN} cobrada el <span className="mono">{c.fecha}</span></p>
        </div>

        <div style={recBody}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <strong style={{ fontSize: 13 }}>Comprobante de pago</strong>
            <span className="mono" style={{ color: "var(--ink-500)", fontSize: 12 }}>N° {numero}</span>
          </div>
          <Row k="Cliente" v={c.cliente} />
          <Row k="Póliza" v={c.poliza} mono />
          <Row k="Compañía" v={c.compania} />
          <Row k="Ramo" v={c.ramo} />
          <Row k="Cuota" v={String(c.cuotaN)} mono />
          <div style={recTotal}><span>Total cobrado</span><span className="mono">{fmt(c.monto)}</span></div>
        </div>

        {/* Enviar */}
        <div style={{ padding: "18px 28px 6px" }}>
          <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Enviar comprobante</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 }}>
            <button disabled={enviando !== null} style={{ ...recBtnSec, borderColor: sent === "email" ? "var(--ok-500)" : "var(--line)", color: sent === "email" ? "var(--ok-700)" : "var(--ink-900)" }} onClick={() => enviar("email")}>
              <IconMail size={15} /> {enviando === "email" ? "Enviando…" : sent === "email" ? "Enviado ✓" : "Email / Online"}
            </button>
            <button disabled={enviando !== null} style={{ ...recBtnSec, borderColor: sent === "wa" ? "oklch(0.55 0.13 150)" : "var(--line)", color: sent === "wa" ? "oklch(0.45 0.13 150)" : "var(--ink-900)" }} onClick={() => enviar("wa")}>
              <Icon size={15} d={<><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></>} /> {enviando === "wa" ? "Enviando…" : sent === "wa" ? "Enviado ✓" : "WhatsApp"}
            </button>
          </div>
          <button disabled={descargando} style={{ ...recBtnSec, width: "100%", marginTop: 10 }} onClick={descargar}>
            <Icon size={15} d={<><path d="M12 3v12m0 0 4-4m-4 4-4-4" /><path d="M4 17v2a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-2" /></>} /> {descargando ? "Descargando…" : "Descargar PDF"}
          </button>
          {aviso && <div style={{ marginTop: 8, fontSize: 12, color: "var(--ink-500)" }}>{aviso}</div>}
        </div>

        {/* Imprimir */}
        <div style={recActions}>
          <button disabled={imprimiendo !== null} style={recBtnSec} onClick={() => imprimir("ticket")}>
            <Icon size={15} d={<><path d="M4 4h16v16l-2-1.2L16 20l-2-1.2L12 20l-2-1.2L8 20l-2-1.2L4 20V4z" /><path d="M8 9h8M8 13h6" /></>} /> {imprimiendo === "ticket" ? "Generando…" : "Ticket"}
          </button>
          <button disabled={imprimiendo !== null} style={recBtnPri} onClick={() => imprimir("comprobante")}>
            <Icon size={15} d={<><path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" rx="1" /></>} /> {imprimiendo === "comprobante" ? "Generando…" : "Comprobante"}
          </button>
        </div>
        {sent && (
          <div style={{ textAlign: "center", marginTop: -6, paddingBottom: 14, fontSize: 12, color: sent === "wa" ? "oklch(0.45 0.13 150)" : "var(--ok-700)" }}>
            ✓ Enviado {sent === "wa" ? "por WhatsApp" : "al correo del asegurado"}
          </div>
        )}

        <button style={recClose} onClick={onClose}>Cerrar</button>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div style={recRow}><span style={{ color: "var(--ink-500)" }}>{k}</span><span style={{ color: "var(--ink-900)", fontWeight: 500, textAlign: "right", fontFamily: mono ? "'JetBrains Mono', monospace" : "inherit" }}>{v}</span></div>
  );
}

const back: CSSProperties = { position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.50)", backdropFilter: "blur(4px)", zIndex: 60, display: "grid", placeItems: "center", padding: 20 };
const modal: CSSProperties = { width: 480, maxWidth: "100%", maxHeight: "calc(100vh - 40px)", overflowY: "auto", background: "var(--paper)", borderRadius: 18, boxShadow: "var(--shadow-lg)" };
const recHead: CSSProperties = { padding: "26px 28px 18px", textAlign: "center" };
const recIcon: CSSProperties = { width: 64, height: 64, borderRadius: "50%", background: "var(--ok-100)", color: "var(--ok-700)", margin: "0 auto 14px", display: "grid", placeItems: "center" };
const recTitle: CSSProperties = { margin: 0, fontSize: 22, letterSpacing: "-0.02em", fontWeight: 600 };
const recSub: CSSProperties = { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 };
const recBody: CSSProperties = { margin: "0 28px", border: "1px dashed var(--line)", borderRadius: 12, padding: "16px 18px", background: "oklch(0.985 0.008 245)" };
const recRow: CSSProperties = { display: "flex", justifyContent: "space-between", padding: "6px 0", fontSize: 13 };
const recTotal: CSSProperties = { marginTop: 10, paddingTop: 12, borderTop: "1px solid var(--line)", display: "flex", justifyContent: "space-between", fontSize: 15, fontWeight: 700, color: "var(--ink-900)" };
const recActions: CSSProperties = { padding: "20px 28px 24px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 10 };
const recBtnPri: CSSProperties = { height: 44, borderRadius: 10, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 };
const recBtnSec: CSSProperties = { height: 44, borderRadius: 10, background: "var(--paper)", color: "var(--ink-900)", border: "1.5px solid var(--line)", cursor: "pointer", fontSize: 13.5, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 };
const recClose: CSSProperties = { width: "100%", padding: "12px", background: "transparent", border: "none", borderTop: "1px solid var(--line-2)", color: "var(--ink-500)", fontSize: 13, cursor: "pointer" };
