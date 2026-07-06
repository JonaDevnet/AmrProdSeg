import { useState, type CSSProperties } from "react";
import { Field, Input, Select } from "../ui/Field";
import Button from "../ui/Button";
import { listarClientes } from "../../api/clientes";
import type { EndosoTitularDto } from "../../api/polizas";

const PROVINCIAS = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Entre Ríos", "Otra"];

interface FormState {
  idType: string; documento: string; nombre: string; apellido: string; nac: string;
  calle: string; numero: string; piso: string; localidad: string; provincia: string;
  telefono: string; email: string; motivo: string;
}
const F0: FormState = {
  idType: "DNI", documento: "", nombre: "", apellido: "", nac: "",
  calle: "", numero: "", piso: "", localidad: "", provincia: "",
  telefono: "", email: "", motivo: "",
};

/**
 * Formulario del nuevo titular para un endoso. Pide los mismos datos del cliente
 * que al dar de alta una póliza. Si el documento ya existe, autocompleta sus datos.
 */
export default function EndosoForm({
  onSubmit, enviando,
}: { onSubmit: (dto: EndosoTitularDto) => Promise<void> | void; enviando: boolean }) {
  const [f, setF] = useState<FormState>(F0);
  const [error, setError] = useState("");
  const set = (k: keyof FormState) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const upper = (k: keyof FormState) => (v: string) => set(k)(v.toUpperCase());

  // Si el documento corresponde a un cliente existente, trae sus datos.
  async function autocompletar() {
    const doc = f.documento.replace(/\D/g, "");
    if (!/^\d{7,11}$/.test(doc)) return;
    try {
      const res = await listarClientes(doc, 1, 5);
      const c = res.items.find((x) => x.documento === doc);
      if (!c) return;
      const [nom, ...resto] = (c.nombre || "").trim().split(/\s+/);
      setF((p) => ({
        ...p,
        nombre: nom ?? p.nombre,
        apellido: resto.join(" ") || p.apellido,
        email: c.email ?? p.email,
        telefono: c.telefono ?? p.telefono,
        idType: c.tipoDocumento ?? p.idType,
      }));
    } catch { /* silencioso */ }
  }

  function enviar() {
    setError("");
    if (f.nombre.trim().length < 2) { setError("Ingresá el nombre del nuevo titular."); return; }
    if (!/^\d{7,11}$/.test(f.documento.replace(/\D/g, ""))) { setError("Documento inválido (7 a 11 dígitos)."); return; }
    const direccion = [
      [f.calle, f.numero].filter((x) => x.trim()).join(" "),
      f.piso, f.localidad, f.provincia,
    ].filter((x) => x && x.trim()).join(", ");
    const dto: EndosoTitularDto = {
      clienteNombre: `${f.nombre} ${f.apellido}`.trim(),
      documento: f.documento.replace(/\D/g, ""),
      email: f.email.trim() || undefined,
      telefono: f.telefono.trim() || undefined,
      direccion: direccion || undefined,
      tipoDocumento: f.idType,
      motivo: f.motivo.trim() || undefined,
    };
    onSubmit(dto);
  }

  const up: CSSProperties = { textTransform: "uppercase" };
  return (
    <div>
      <p style={{ marginTop: 0, marginBottom: 16, fontSize: 13, color: "var(--ink-500)" }}>
        Cargá los datos del <strong>nuevo titular</strong>. La póliza no cambia nada más; el titular anterior queda guardado.
      </p>

      <div style={grid}>
        <Field label="Tipo de documento">
          <Select value={f.idType} onChange={(e) => set("idType")(e.target.value)}>
            {["DNI", "CUIL", "CUIT", "Pasaporte"].map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Documento">
          <Input className="mono" value={f.documento} placeholder="Sin puntos ni guiones"
            onChange={(e) => set("documento")(e.target.value)} onBlur={autocompletar} />
        </Field>
      </div>

      <div style={grid}>
        <Field label="Nombre"><Input style={up} value={f.nombre} placeholder="Nombre" onChange={(e) => upper("nombre")(e.target.value)} /></Field>
        <Field label="Apellido"><Input style={up} value={f.apellido} placeholder="Apellido" onChange={(e) => upper("apellido")(e.target.value)} /></Field>
      </div>

      <Field label="Fecha de nacimiento">
        <Input type="date" value={f.nac} onChange={(e) => set("nac")(e.target.value)} />
      </Field>

      <Field label="Domicilio (calle)">
        <Input style={up} value={f.calle} placeholder="Av. Corrientes" onChange={(e) => upper("calle")(e.target.value)} />
      </Field>
      <div style={grid}>
        <Field label="Número"><Input className="mono" value={f.numero} placeholder="3450" onChange={(e) => set("numero")(e.target.value)} /></Field>
        <Field label="Piso / Dto."><Input style={up} value={f.piso} placeholder="5° B" onChange={(e) => upper("piso")(e.target.value)} /></Field>
      </div>
      <div style={grid}>
        <Field label="Localidad"><Input style={up} value={f.localidad} placeholder="CABA" onChange={(e) => upper("localidad")(e.target.value)} /></Field>
        <Field label="Provincia">
          <Select value={f.provincia} onChange={(e) => set("provincia")(e.target.value)}>
            <option value="">Seleccionar</option>
            {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </Field>
      </div>

      <div style={grid}>
        <Field label="Teléfono"><Input className="mono" value={f.telefono} placeholder="+54 11 5555-1234" onChange={(e) => set("telefono")(e.target.value)} /></Field>
        <Field label="Correo electrónico"><Input type="email" value={f.email} placeholder="nombre@correo.com" onChange={(e) => set("email")(e.target.value)} /></Field>
      </div>

      <Field label="Motivo del endoso (opcional)">
        <Input value={f.motivo} placeholder="Ej. venta del vehículo" onChange={(e) => set("motivo")(e.target.value)} />
      </Field>

      {error && (
        <div style={{ margin: "4px 0 12px", padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>
          {error}
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 4 }}>
        <Button onClick={enviar} disabled={enviando}>
          {enviando ? "Guardando…" : "Confirmar endoso"}
        </Button>
      </div>
    </div>
  );
}

const grid: CSSProperties = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 };
