import { useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import { Field, Input, Select } from "../ui/Field";
import { useMetodosPago, usePagarCuota } from "../../hooks/cobranzas";
import { formatMoneda } from "../../utils/format";
import type { Cobro } from "../../types";

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}

interface Props {
  cuota: Cobro;
  tituloContexto?: string;
  onClose: () => void;
  onPagado: () => void;
}

export default function PagoModal({ cuota, tituloContexto, onClose, onPagado }: Props) {
  const metodos = useMetodosPago();
  const pagar = usePagarCuota();
  const [fechaPago, setFechaPago] = useState(hoyISO());
  const [metodoPagoId, setMetodoPagoId] = useState<string>("");
  const [error, setError] = useState<string>();

  async function confirmar() {
    setError(undefined);
    try {
      await pagar.mutateAsync({
        id: cuota.id,
        fechaPago,
        metodoPagoId: metodoPagoId ? Number(metodoPagoId) : undefined,
      });
      onPagado();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo registrar el pago.");
    }
  }

  return (
    <Modal titulo="Registrar pago" onClose={onClose} ancho={440}>
      <div
        style={{
          background: "var(--canvas)",
          border: "1px solid var(--line-2)",
          borderRadius: 10,
          padding: "12px 14px",
          marginBottom: 16,
          fontSize: 14,
        }}
      >
        <div style={{ color: "var(--ink-500)", fontSize: 12.5 }}>
          {tituloContexto ?? cuota.nroPoliza ?? `Póliza #${cuota.polizaId}`}
        </div>
        <div style={{ fontWeight: 600, marginTop: 2 }}>
          Cuota #{cuota.numeroCuota} · {formatMoneda(cuota.monto)}
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
          {error}
        </div>
      )}

      <Field label="Fecha de pago">
        <Input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} />
      </Field>

      <Field label="Método de pago">
        <Select value={metodoPagoId} onChange={(e) => setMetodoPagoId(e.target.value)}>
          <option value="">— Sin especificar —</option>
          {metodos.data?.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </Select>
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={confirmar} disabled={pagar.isPending}>
          {pagar.isPending ? "Registrando…" : "Confirmar pago"}
        </Button>
      </div>
    </Modal>
  );
}
