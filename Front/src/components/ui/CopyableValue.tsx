import { useState, type CSSProperties } from "react";

/** Muestra un valor con botón de copiar al portapapeles (feedback "copiado"). */
export default function CopyableValue({ value, mono, align = "end" }: { value?: string | number | null; mono?: boolean; align?: "start" | "end" }) {
  const [copied, setCopied] = useState(false);
  const texto = value != null && value !== "" ? String(value) : "";

  async function copiar() {
    if (!texto) return;
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      // Fallback para navegadores/HTTP sin Clipboard API
      const ta = document.createElement("textarea");
      ta.value = texto; ta.style.position = "fixed"; ta.style.opacity = "0";
      document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (!texto) return <span style={{ color: "var(--ink-400)" }}>—</span>;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6, justifyContent: align === "start" ? "flex-start" : "flex-end" }}>
      <span style={{ ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 } : {}) }}>{texto}</span>
      <button onClick={copiar} title={copied ? "¡Copiado!" : "Copiar"} style={btn(copied)}>
        {copied ? "✓" : (
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </span>
  );
}

function btn(copied: boolean): CSSProperties {
  return {
    display: "inline-grid", placeItems: "center", width: 22, height: 22, borderRadius: 6,
    border: "1px solid var(--line)", background: copied ? "var(--ok-100)" : "var(--paper)",
    color: copied ? "var(--ok-700)" : "var(--ink-400)", cursor: "pointer", flexShrink: 0, fontSize: 12,
  };
}
