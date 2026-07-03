// Configuración del sistema (sólo Admin). Hoy: parámetros SMTP, incluido el
// correo emisor. Se persisten en la base y se aplican al enviar.
import { useEffect, useState, type CSSProperties } from "react";
import {
  getSmtpConfig, actualizarSmtpConfig,
  getWhatsappConfig, actualizarWhatsappConfig,
} from "../api/configuracion";
import { Icon, IconMail, IconCheck } from "../design/icons";

export default function Configuracion() {
  const [habilitado, setHabilitado] = useState(false);
  const [host, setHost] = useState("");
  const [port, setPort] = useState(587);
  const [usarSsl, setUsarSsl] = useState(true);
  const [usuario, setUsuario] = useState("");
  const [from, setFrom] = useState("");
  const [fromNombre, setFromNombre] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfigurada, setPasswordConfigurada] = useState(false);

  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    getSmtpConfig().then((c) => {
      setHabilitado(c.habilitado); setHost(c.host); setPort(c.port); setUsarSsl(c.usarSsl);
      setUsuario(c.usuario); setFrom(c.from); setFromNombre(c.fromNombre); setPasswordConfigurada(c.passwordConfigurada);
    }).catch(() => setError("No se pudo cargar la configuración.")).finally(() => setCargando(false));
  }, []);

  async function guardar() {
    setError(""); setOk("");
    if (habilitado && !from.trim()) { setError("Ingresá el correo emisor (From)."); return; }
    setBusy(true);
    try {
      await actualizarSmtpConfig({ habilitado, host: host.trim(), port, usarSsl, usuario: usuario.trim(), from: from.trim(), fromNombre: fromNombre.trim(), password: password || undefined });
      setOk("Configuración guardada.");
      if (password) { setPasswordConfigurada(true); setPassword(""); }
      setTimeout(() => setOk(""), 3500);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo guardar la configuración.");
    } finally { setBusy(false); }
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <div style={{ padding: "32px 0 16px" }}>
        <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Inicio · Configuración</div>
        <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600 }}>Configuración</h1>
        <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 }}>Parámetros del sistema. Sólo el administrador puede editarlos.</p>
      </div>

      <div style={card}>
        <div style={cardHead}>
          <div style={{ ...iconBox }}><IconMail size={18} /></div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>Correo emisor (SMTP)</div>
            <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Servidor y dirección desde la que se envían los comprobantes y avisos.</div>
          </div>
        </div>

        {cargando ? (
          <div style={{ padding: "30px", color: "var(--ink-500)" }}>Cargando…</div>
        ) : (
          <div style={{ padding: "20px 22px" }}>
            <label style={toggle}>
              <input type="checkbox" checked={habilitado} onChange={(e) => setHabilitado(e.target.checked)} />
              <span>Envío de Email <strong>{habilitado ? "habilitado" : "desactivado"}</strong></span>
            </label>

            <Campo label="Correo emisor (From)" req>
              <input value={from} onChange={(e) => setFrom(e.target.value)} placeholder="no-responder@amrseguros.com.ar" style={input} />
            </Campo>
            <div style={dos}>
              <Campo label="Nombre del emisor"><input value={fromNombre} onChange={(e) => setFromNombre(e.target.value)} placeholder="AMR Producción de Seguros" style={input} /></Campo>
              <Campo label="Usuario SMTP"><input value={usuario} onChange={(e) => setUsuario(e.target.value)} placeholder="usuario@gmail.com" style={input} /></Campo>
            </div>
            <div style={dos}>
              <Campo label="Servidor (host)"><input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" style={input} /></Campo>
              <Campo label="Puerto"><input type="number" value={port} onChange={(e) => setPort(Number(e.target.value) || 587)} style={input} /></Campo>
            </div>
            <div style={dos}>
              <Campo label={`Contraseña ${passwordConfigurada ? "(configurada — dejar vacío para mantener)" : ""}`}>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={passwordConfigurada ? "••••••••" : "Contraseña de aplicación"} style={input} />
              </Campo>
              <Campo label="Seguridad">
                <label style={{ ...toggle, marginTop: 6 }}>
                  <input type="checkbox" checked={usarSsl} onChange={(e) => setUsarSsl(e.target.checked)} /> <span>Usar SSL/TLS</span>
                </label>
              </Campo>
            </div>

            {error && <div style={errBox}>{error}</div>}
            {ok && <div style={okBox}><IconCheck size={14} /> {ok}</div>}

            <button onClick={guardar} disabled={busy} style={primaryBtn}>{busy ? "Guardando…" : "Guardar configuración"}</button>
            <p style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 12 }}>
              Tip: con Gmail usá una <strong>contraseña de aplicación</strong> y puerto 587 con SSL/TLS.
            </p>
          </div>
        )}
      </div>

      <WhatsappCard />
    </div>
  );
}

function WhatsappCard() {
  const [habilitado, setHabilitado] = useState(false);
  const [baseUrl, setBaseUrl] = useState("");
  const [instance, setInstance] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiKeyConfigurada, setApiKeyConfigurada] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  useEffect(() => {
    getWhatsappConfig().then((c) => {
      setHabilitado(c.habilitado); setBaseUrl(c.baseUrl); setInstance(c.instance); setApiKeyConfigurada(c.apiKeyConfigurada);
    }).catch(() => setError("No se pudo cargar la configuración.")).finally(() => setCargando(false));
  }, []);

  async function guardar() {
    setError(""); setOk("");
    if (habilitado && (!baseUrl.trim() || !instance.trim())) { setError("Completá BaseUrl e Instance."); return; }
    setBusy(true);
    try {
      await actualizarWhatsappConfig({ habilitado, baseUrl: baseUrl.trim(), instance: instance.trim(), apiKey: apiKey || undefined });
      setOk("Configuración guardada.");
      if (apiKey) { setApiKeyConfigurada(true); setApiKey(""); }
      setTimeout(() => setOk(""), 3500);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo guardar la configuración.");
    } finally { setBusy(false); }
  }

  return (
    <div style={card}>
      <div style={cardHead}>
        <div style={{ ...iconBox, background: "oklch(0.95 0.05 150)", color: "oklch(0.42 0.13 150)" }}>
          <Icon size={18} d={<><path d="M12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.5A10 10 0 1 0 12 2z" /></>} />
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16 }}>WhatsApp (Evolution API)</div>
          <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Gateway para enviar recordatorios y comprobantes por WhatsApp.</div>
        </div>
      </div>

      {cargando ? (
        <div style={{ padding: "30px", color: "var(--ink-500)" }}>Cargando…</div>
      ) : (
        <div style={{ padding: "20px 22px" }}>
          <label style={toggle}>
            <input type="checkbox" checked={habilitado} onChange={(e) => setHabilitado(e.target.checked)} />
            <span>Envío de WhatsApp <strong>{habilitado ? "habilitado" : "desactivado"}</strong></span>
          </label>

          <div style={dos}>
            <Campo label="BaseUrl (servidor Evolution)" req={habilitado}><input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="http://localhost:8080" style={input} /></Campo>
            <Campo label="Instance (instancia)" req={habilitado}><input value={instance} onChange={(e) => setInstance(e.target.value)} placeholder="amr" style={input} /></Campo>
          </div>
          <Campo label={`API Key ${apiKeyConfigurada ? "(configurada — dejar vacío para mantener)" : ""}`}>
            <input type="password" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={apiKeyConfigurada ? "••••••••" : "Clave de la Evolution API"} style={input} />
          </Campo>

          {error && <div style={errBox}>{error}</div>}
          {ok && <div style={okBox}><IconCheck size={14} /> {ok}</div>}

          <button onClick={guardar} disabled={busy} style={primaryBtn}>{busy ? "Guardando…" : "Guardar configuración"}</button>
          <p style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 12 }}>
            Necesitás un servidor Evolution API corriendo con una instancia vinculada a tu WhatsApp (escaneando el QR). El teléfono del cliente se normaliza al formato AR automáticamente.
          </p>
        </div>
      )}
    </div>
  );
}

function Campo({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", marginBottom: 7 }}>{label}{req && <span style={{ color: "var(--bad-700)" }}> *</span>}</div>
      {children}
    </div>
  );
}

const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden", marginBottom: 40 };
const cardHead: CSSProperties = { padding: "18px 22px", borderBottom: "1px solid var(--line-2)", display: "flex", alignItems: "center", gap: 14 };
const iconBox: CSSProperties = { width: 40, height: 40, borderRadius: 10, background: "var(--blue-100)", color: "var(--navy-900)", display: "grid", placeItems: "center", flexShrink: 0 };
const input: CSSProperties = { width: "100%", height: 42, borderRadius: 9, border: "1.5px solid var(--line)", padding: "0 12px", fontSize: 14, outline: "none", background: "var(--paper)", color: "var(--ink-900)", boxSizing: "border-box" };
const dos: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 };
const toggle: CSSProperties = { display: "flex", alignItems: "center", gap: 10, fontSize: 13.5, color: "var(--ink-700)", marginBottom: 16, cursor: "pointer" };
const errBox: CSSProperties = { margin: "0 0 12px", padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" };
const okBox: CSSProperties = { margin: "0 0 12px", padding: "10px 14px", background: "var(--ok-100)", border: "1px solid var(--ok-500)", borderRadius: 9, fontSize: 13, color: "var(--ok-700)", display: "inline-flex", alignItems: "center", gap: 8 };
const primaryBtn: CSSProperties = { height: 44, padding: "0 20px", borderRadius: 10, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 14, fontWeight: 600 };
