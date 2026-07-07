import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input } from "../ui/Field";
import Button from "../ui/Button";
import type { Cliente } from "../../types";

const schema = z.object({
  nombre: z.string().min(3, "Mínimo 3 caracteres").max(150),
  documento: z.string().regex(/^\d{7,11}$/, "El documento debe tener 7 a 11 dígitos"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefono: z.string().max(30).optional().or(z.literal("")),
  direccion: z.string().max(200).optional().or(z.literal("")),
});

// La fecha de nacimiento se maneja aparte (texto para pegar/escribir + calendario).
export type ClienteFormValues = z.infer<typeof schema> & { fechaNacimiento?: string };

const pad = (n: string) => n.padStart(2, "0");
// Acepta "DD/MM/AAAA", "AAAA-MM-DD" y variantes con - / . → devuelve "AAAA-MM-DD" o null.
function parseFecha(s: string): string | null {
  s = (s || "").trim();
  if (!s) return null;
  let y = "", mo = "", d = "";
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (m) { [, y, mo, d] = m; }
  else {
    m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
    if (m) { [, d, mo, y] = m; } else return null;
  }
  const mm = pad(mo), dd = pad(d);
  if (+mm < 1 || +mm > 12 || +dd < 1 || +dd > 31) return null;
  return `${y}-${mm}-${dd}`;
}
// "AAAA-MM-DD" → "DD/MM/AAAA" para mostrar.
function toDisplay(iso: string): string {
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

interface Props {
  cliente?: Cliente;
  onSubmit: (v: ClienteFormValues) => Promise<void> | void;
  enviando: boolean;
}

export default function ClienteForm({ cliente, onSubmit, enviando }: Props) {
  const editar = !!cliente;
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: cliente?.nombre ?? "",
      documento: cliente?.documento ?? "",
      email: cliente?.email ?? "",
      telefono: cliente?.telefono ?? "",
      direccion: cliente?.direccion ?? "",
    },
  });

  // Fecha de nacimiento: valor canónico (AAAA-MM-DD) + texto visible (DD/MM/AAAA).
  const nacIni = cliente?.fechaNacimiento ? cliente.fechaNacimiento.slice(0, 10) : "";
  const [nac, setNac] = useState(nacIni);
  const [nacText, setNacText] = useState(nacIni ? toDisplay(nacIni) : "");

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({ ...v, fechaNacimiento: nac || undefined }))}>
      <Field label="Nombre / Razón social" error={errors.nombre?.message}>
        <Input {...register("nombre")} placeholder="Juan Pérez" />
      </Field>

      {/* El documento sólo se carga al crear; su corrección posterior es acción de Admin */}
      <Field
        label="Documento (DNI / CUIT)"
        error={errors.documento?.message}
      >
        <Input
          {...register("documento")}
          placeholder="30111222"
          disabled={editar}
          style={editar ? { background: "var(--canvas)", color: "var(--ink-500)" } : undefined}
        />
      </Field>

      <Field label="Email" error={errors.email?.message}>
        <Input {...register("email")} placeholder="cliente@mail.com" />
      </Field>

      <Field label="Fecha de nacimiento">
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <Input
            value={nacText}
            onChange={(e) => setNacText(e.target.value)}
            onBlur={() => {
              const p = parseFecha(nacText);
              if (p) { setNac(p); setNacText(toDisplay(p)); }
              else if (!nacText.trim()) { setNac(""); }
            }}
            placeholder="DD/MM/AAAA (escribí o pegá)"
            style={{ flex: 1 }}
          />
          <Input
            type="date"
            value={nac}
            onChange={(e) => { setNac(e.target.value); setNacText(e.target.value ? toDisplay(e.target.value) : ""); }}
            style={{ maxWidth: 165 }}
            title="Elegir del calendario"
          />
        </div>
      </Field>

      <Field label="Teléfono" error={errors.telefono?.message}>
        <Input {...register("telefono")} placeholder="11-4000-0000" />
      </Field>

      <Field label="Dirección" error={errors.direccion?.message}>
        <Input {...register("direccion")} placeholder="Av. Siempreviva 742" />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Guardando…" : editar ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </div>
    </form>
  );
}
