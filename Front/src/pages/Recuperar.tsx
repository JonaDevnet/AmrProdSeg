import { useState, type CSSProperties } from "react";
import { Link, useNavigate } from "react-router-dom";
import { solicitarReset, confirmarReset } from "../api/auth";
import { Field, Input } from "../components/ui/Field";
import Button from "../components/ui/Button";
import { IconArrowLeft } from "../components/Icons";

type Tab = "solicitar" | "confirmar";

export default function Recuperar() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("solicitar");

  // Solicitar
  const [emailSol, setEmailSol] = useState("");
  const [solMsg, setSolMsg] = useState<string>();
  const [solBusy, setSolBusy] = useState(false);

  // Confirmar
  const [emailConf, setEmailConf] = useState("");
  const [pass, setPass] = useState("");
  const [confError, setConfError] = useState<string>();
  const [confOk, setConfOk] = useState(false);
  const [confBusy, setConfBusy] = useState(false);

  async function enviarSolicitud() {
    setSolMsg(undefined);
    setSolBusy(true);
    try {
      await solicitarReset(emailSol.trim());
      setSolMsg("Solicitud enviada. Pedile al administrador que la autorice; luego volvé y elegí «Ya autorizado» para definir tu nueva contraseña.");
    } finally {
      setSolBusy(false);
    }
  }

  async function confirmar() {
    setConfError(undefined);
    if (pass.length < 8) return setConfError("La contraseña debe tener al menos 8 caracteres.");
    setConfBusy(true);
    try {
      await confirmarReset(emailConf.trim(), pass);
      setConfOk(true);
    } catch (e: any) {
      setConfError(e?.response?.data?.error ?? "No se pudo cambiar la contraseña.");
    } finally {
      setConfBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--canvas)", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 440, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow)", padding: 32 }}>
        <button onClick={() => navigate("/login")} style={back}>
          <IconArrowLeft size={16} /> Volver al login
        </button>

        <h1 style={{ fontSize: 22, fontWeight: 600, margin: "12px 0 4px" }}>Recuperar contraseña</h1>
        <p style={{ color: "var(--ink-500)", fontSize: 14, margin: "0 0 20px" }}>
          El cambio debe ser autorizado por el administrador.
        </p>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 20, background: "var(--canvas)", padding: 4, borderRadius: 10 }}>
          <TabBtn activo={tab === "solicitar"} onClick={() => setTab("solicitar")}>1. Pedir cambio</TabBtn>
          <TabBtn activo={tab === "confirmar"} onClick={() => setTab("confirmar")}>2. Ya autorizado</TabBtn>
        </div>

        {tab === "solicitar" ? (
          <>
            <Field label="Tu email">
              <Input value={emailSol} onChange={(e) => setEmailSol(e.target.value)} placeholder="vendedor@amr.com" />
            </Field>
            {solMsg && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--ok-100)", border: "1px solid var(--ok-500)", borderRadius: 9, fontSize: 13, color: "var(--ok-700)" }}>
                {solMsg}
              </div>
            )}
            <Button onClick={enviarSolicitud} disabled={solBusy} style={{ width: "100%" }}>
              {solBusy ? "Enviando…" : "Solicitar cambio de contraseña"}
            </Button>
          </>
        ) : confOk ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ fontSize: 15, color: "var(--ok-700)", fontWeight: 600, marginBottom: 8 }}>
              ✓ Contraseña actualizada
            </div>
            <p style={{ color: "var(--ink-500)", fontSize: 14 }}>Ya podés iniciar sesión con tu nueva contraseña.</p>
            <Link to="/login" style={{ color: "var(--blue-600)", fontWeight: 500, textDecoration: "none" }}>Ir al login</Link>
          </div>
        ) : (
          <>
            <Field label="Tu email">
              <Input value={emailConf} onChange={(e) => setEmailConf(e.target.value)} placeholder="vendedor@amr.com" />
            </Field>
            <Field label="Nueva contraseña">
              <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Mínimo 8 caracteres" />
            </Field>
            {confError && (
              <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
                {confError}
              </div>
            )}
            <Button onClick={confirmar} disabled={confBusy} style={{ width: "100%" }}>
              {confBusy ? "Guardando…" : "Definir nueva contraseña"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function TabBtn({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      flex: 1, height: 38, borderRadius: 8, border: 0, cursor: "pointer", fontSize: 13.5, fontWeight: 600,
      background: activo ? "var(--paper)" : "transparent",
      color: activo ? "var(--navy-900)" : "var(--ink-500)",
      boxShadow: activo ? "var(--shadow-sm)" : "none",
    }}>
      {children}
    </button>
  );
}

const back: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, border: 0, background: "transparent", color: "var(--ink-500)", cursor: "pointer", fontSize: 13, padding: 0 };
