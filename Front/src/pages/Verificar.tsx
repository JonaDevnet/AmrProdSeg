// Página pública de verificación de póliza (destino del QR del comprobante).
import { useEffect, useState, type CSSProperties } from "react";
import { useParams } from "react-router-dom";
import { verificarPoliza, type Verificacion } from "../api/verificacion";
import { formatFecha } from "../utils/format";

export default function Verificar() {
  const { id } = useParams();
  const [data, setData] = useState<Verificacion | null>(null);
  const [estado, setEstado] = useState<"cargando" | "ok" | "no">("cargando");

  useEffect(() => {
    let vivo = true;
    verificarPoliza(id ?? "")
      .then((d) => { if (!vivo) return; if (d) { setData(d); setEstado("ok"); } else setEstado("no"); })
      .catch(() => vivo && setEstado("no"));
    return () => { vivo = false; };
  }, [id]);

  return (
    <div style={page}>
      <header style={header}>
        <div style={hin}>
          <img src="/logo.png" alt="AMR" style={logoImg} />
          <div>
            <b style={{ fontSize: 15, letterSpacing: "0.02em" }}>AMRINALDI PRODUCCIÓN DE SEGUROS</b>
            <span style={{ display: "block", fontSize: 10.5, color: "var(--blue-300)", letterSpacing: "0.06em" }}>VERIFICACIÓN DE PÓLIZA</span>
          </div>
        </div>
      </header>

      <div style={wrap}>
        {estado === "cargando" && <div style={{ ...card, ...sect, marginTop: 24, textAlign: "center", color: "var(--ink-500)" }}>Verificando…</div>}

        {estado === "no" && (
          <div style={{ ...card, ...statusCard, marginTop: -42 }}>
            <div style={{ ...badge, background: "var(--bad-100)", color: "var(--bad-700)" }}>✕</div>
            <div>
              <h1 style={h1}>Póliza no encontrada</h1>
              <p style={sub}>No pudimos verificar esta póliza. Verificá el enlace o consultá con tu productor.</p>
            </div>
          </div>
        )}

        {estado === "ok" && data && (
          <>
            <div style={{ ...card, ...statusCard, marginTop: -42 }}>
              <div style={{ ...badge, background: data.vigente ? "var(--ok-100)" : "var(--warn-100)", color: data.vigente ? "var(--ok-700)" : "var(--warn-700)" }}>{data.vigente ? "✓" : "!"}</div>
              <div>
                <h1 style={h1}>{data.vigente ? "Póliza vigente" : "Póliza no vigente"}</h1>
                <p style={sub}>Póliza N° <span className="mono">{data.nroPoliza}</span> · verificada al {formatFecha(new Date().toISOString())}</p>
              </div>
            </div>

            <Seccion titulo="Asegurado">
              <Row k="Nombre completo" v={data.clienteNombre} />
              <Row k="DNI" v={data.documento} mono last />
            </Seccion>

            <Seccion titulo="Vehículo">
              <Row k="Marca / Modelo" v={`${data.marca} ${data.modelo}`.trim()} />
              <Row k="Año" v={data.anio || "—"} mono />
              <Row k="Patente" v={data.patente} mono />
              <Row k="Cobertura" v={data.cobertura} last />
            </Seccion>

            <Seccion titulo="Póliza">
              <Row k="Compañía" v={data.compania} />
              <Row k="N° de póliza" v={data.nroPoliza} mono />
              <Row k="Estado" v="" pill={data.vigente ? "Vigente" : "No vigente"} vigente={data.vigente} />
              <Row k="Próximo vencimiento" v={data.proximoVencimiento ? formatFecha(data.proximoVencimiento) : "—"} mono last />
            </Seccion>
          </>
        )}

        <footer style={foot}>
          Datos verificados por <b>AMRINALDI Producción de Seguros</b> — de Alberto Mateo Rinaldi.<br />
          Esta página confirma la vigencia de la póliza al momento de la consulta.
        </footer>
      </div>
    </div>
  );
}

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div style={{ ...card, ...sect }}>
      <h2 style={h2}>{titulo}</h2>
      {children}
    </div>
  );
}

function Row({ k, v, mono, last, pill, vigente }: { k: string; v: string; mono?: boolean; last?: boolean; pill?: string; vigente?: boolean }) {
  return (
    <div style={{ ...rowS, borderBottom: last ? "0" : "1px dashed var(--line)" }}>
      <span style={{ color: "var(--ink-500)" }}>{k}</span>
      {pill
        ? <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: vigente ? "var(--ok-100)" : "var(--warn-100)", color: vigente ? "var(--ok-700)" : "var(--warn-700)", fontWeight: 700, fontSize: 12, padding: "3px 10px", borderRadius: 999 }}>● {pill}</span>
        : <span style={{ fontWeight: 600, textAlign: "right", overflowWrap: "anywhere", fontFamily: mono ? "'JetBrains Mono', monospace" : undefined }}>{v || "—"}</span>}
    </div>
  );
}

const page: CSSProperties = { minHeight: "100vh", background: "var(--canvas)", fontFamily: '"DM Sans", system-ui, sans-serif', color: "var(--ink-900)" };
const header: CSSProperties = { background: "linear-gradient(160deg, var(--navy-950), var(--navy-800))", color: "white", padding: "26px 0 60px" };
const hin: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", gap: 12 };
const logoImg: CSSProperties = { height: 48, width: "auto", filter: "brightness(0) invert(1)" };
const wrap: CSSProperties = { maxWidth: 560, margin: "0 auto", padding: "0 16px 48px" };
const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "0 8px 24px -14px rgba(20,26,46,.25)" };
const statusCard: CSSProperties = { padding: "20px 22px", display: "flex", alignItems: "center", gap: 14 };
const badge: CSSProperties = { width: 52, height: 52, borderRadius: "50%", display: "grid", placeItems: "center", fontSize: 26, flexShrink: 0 };
const h1: CSSProperties = { margin: 0, fontSize: 19, letterSpacing: "-0.02em" };
const sub: CSSProperties = { margin: "3px 0 0", color: "var(--ink-500)", fontSize: 13 };
const sect: CSSProperties = { marginTop: 16, padding: "18px 22px" };
const h2: CSSProperties = { margin: "0 0 12px", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--blue-600)" };
const rowS: CSSProperties = { display: "flex", justifyContent: "space-between", gap: 14, padding: "8px 0", fontSize: 14 };
const foot: CSSProperties = { textAlign: "center", color: "var(--ink-400)", fontSize: 12, lineHeight: 1.5, marginTop: 22 };
