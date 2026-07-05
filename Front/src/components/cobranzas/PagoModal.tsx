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
  const [conSegundo, setConSegundo] = useState(false);
  const [metodoPago2Id, setMetodoPago2Id] = useState<string>("");
  const [monto2, setMonto2] = useState<string>("");
  const [error, setError] = useState<string>();

  const usaSegundo = conSegundo && !!metodoPago2Id && metodoPago2Id !== metodoPagoId;
  const monto2Num = Number(monto2);

  async function confirmar() {
    setError(undefined);
    if (!metodoPagoId) {
      setError("Elegí el método de pago.");
      return;
    }
    if (usaSegundo && (!monto2 || isNaN(monto2Num) || monto2Num <= 0 || monto2Num >= cuota.monto)) {
      setError("Indicá cuánto se pagó con el segundo método (mayor a 0 y menor al total de la cuota).");
      return;
    }
    try {
      await pagar.mutateAsync({
        id: cuota.id,
        fechaPago,
        metodoPagoId: Number(metodoPagoId),
        metodoPago2Id: usaSegundo ? Number(metodoPago2Id) : undefined,
        metodoPago2Monto: usaSegundo ? monto2Num : undefined,
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

      <Field label="Método de pago *">
        <Select value={metodoPagoId} onChange={(e) => { setMetodoPagoId(e.target.value); if (e.target.value === metodoPago2Id) setMetodoPago2Id(""); }}>
          <option value="">— Seleccioná el método —</option>
          {metodos.data?.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre}</option>
          ))}
        </Select>
      </Field>

      {/* Pago mixto (poco frecuente): parte con un método, parte con otro */}
      {!conSegundo ? (
        <button type="button" onClick={() => setConSegundo(true)}
          style={{ border: 0, background: "transparent", color: "var(--blue-600)", fontSize: 13, fontWeight: 600, cursor: "pointer", padding: 0, marginBottom: 14 }}>
          + Agregar segundo método (pago mixto)
        </button>
      ) : (
        <>
          <Field label="Segundo método (opcional)">
            <div style={{ display: "flex", gap: 8 }}>
              <Select value={metodoPago2Id} onChange={(e) => setMetodoPago2Id(e.target.value)} style={{ flex: 1 }}>
                <option value="">— Sin segundo método —</option>
                {metodos.data?.filter((m) => String(m.id) !== metodoPagoId).map((m) => (
                  <option key={m.id} value={m.id}>{m.nombre}</option>
                ))}
              </Select>
              <button type="button" title="Quitar segundo método"
                onClick={() => { setConSegundo(false); setMetodoPago2Id(""); setMonto2(""); }}
                style={{ border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-500)", borderRadius: 8, width: 34, cursor: "pointer" }}>
                ✕
              </button>
            </div>
          </Field>
          {usaSegundo && (
            <Field label="Monto pagado con el segundo método *">
              <Input type="number" step="0.01" min="0" max={cuota.monto} value={monto2}
                placeholder={`Menor a ${formatMoneda(cuota.monto)}`}
                onChange={(e) => setMonto2(e.target.value)} />
              {monto2 && !isNaN(monto2Num) && monto2Num > 0 && monto2Num < cuota.monto && (
                <div style={{ marginTop: 6, fontSize: 12.5, color: "var(--ink-500)" }}>
                  {formatMoneda(cuota.monto - monto2Num)} con el método principal · {formatMoneda(monto2Num)} con el segundo
                </div>
              )}
            </Field>
          )}
        </>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button variant="secondary" onClick={onClose}>Cancelar</Button>
        <Button onClick={confirmar} disabled={pagar.isPending}>
          {pagar.isPending ? "Registrando…" : "Confirmar pago"}
        </Button>
      </div>
    </Modal>
  );
}
