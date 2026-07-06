import { useEffect, type ReactNode } from "react";
import { IconX } from "../Icons";

interface Props {
  titulo: string;
  onClose: () => void;
  children: ReactNode;
  ancho?: number;
}

export default function Modal({ titulo, onClose, children, ancho = 480 }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(0.2 0.02 250 / 0.4)",
        display: "grid",
        placeItems: "center",
        zIndex: 50,
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%",
          maxWidth: ancho,
          maxHeight: "calc(100vh - 40px)",
          background: "var(--paper)",
          borderRadius: 14,
          boxShadow: "var(--shadow-lg)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "18px 22px",
            borderBottom: "1px solid var(--line)",
            flexShrink: 0,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 600 }}>{titulo}</h3>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-500)" }}
          >
            <IconX size={20} />
          </button>
        </div>
        <div style={{ padding: 22, overflowY: "auto" }}>{children}</div>
      </div>
    </div>
  );
}
