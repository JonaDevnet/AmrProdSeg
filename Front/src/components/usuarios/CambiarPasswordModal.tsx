import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Field, Input } from "../ui/Field";
import { useCambiarPassword } from "../../hooks/admin";

export default function CambiarPasswordModal({ onClose }: { onClose: () => void }) {
  const cambiar = useCambiarPassword();
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [error, setError] = useState<string>();
  const [ok, setOk] = useState(false);

  async function guardar() {
    setError(undefined);
    if (nueva.length < 8) return setError("La nueva contraseña debe tener al menos 8 caracteres.");
    try {
      await cambiar.mutateAsync({ actual, nueva });
      setOk(true);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo cambiar la contraseña.");
    }
  }

  return (
    <Modal titulo="Cambiar mi contraseña" onClose={onClose} ancho={420}>
      {ok ? (
        <div style={{ textAlign: "center", padding: "8px 0" }}>
          <div style={{ color: "var(--ok-700)", fontWeight: 600, marginBottom: 12 }}>✓ Contraseña actualizada</div>
          <Button onClick={onClose}>Cerrar</Button>
        </div>
      ) : (
        <>
          {error && <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{error}</div>}
          <Field label="Contraseña actual">
            <Input type="password" value={actual} onChange={(e) => setActual(e.target.value)} />
          </Field>
          <Field label="Nueva contraseña">
            <Input type="password" value={nueva} onChange={(e) => setNueva(e.target.value)} placeholder="Mínimo 8 caracteres" />
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={guardar} disabled={cambiar.isPending}>{cambiar.isPending ? "Guardando…" : "Guardar"}</Button>
          </div>
        </>
      )}
    </Modal>
  );
}
