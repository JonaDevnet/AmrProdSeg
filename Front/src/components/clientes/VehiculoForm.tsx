import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input } from "../ui/Field";
import Button from "../ui/Button";
import type { Vehiculo } from "../../types";

// Misma lista de combustibles que se usa al cargar una póliza nueva.
const COMBUSTIBLES = ["Nafta", "Diesel", "GNC", "Híbrido", "Eléctrico"];

const schema = z.object({
  marca: z.string().min(1, "Requerido").max(60),
  modelo: z.string().min(1, "Requerido").max(60),
  anio: z.coerce.number().int().min(1950, "Año inválido").max(new Date().getFullYear() + 1, "Año inválido"),
  patente: z.string().min(1, "Requerido").max(10),
  chasis: z.string().max(50).optional().or(z.literal("")),
  motor: z.string().max(50).optional().or(z.literal("")),
});

export type VehiculoFormValues = z.infer<typeof schema> & { combustion?: string };

interface Props {
  vehiculo?: Vehiculo;
  onSubmit: (v: VehiculoFormValues) => Promise<void> | void;
  enviando: boolean;
}

export default function VehiculoForm({ vehiculo, onSubmit, enviando }: Props) {
  const editar = !!vehiculo;
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      marca: vehiculo?.marca ?? "",
      modelo: vehiculo?.modelo ?? "",
      anio: vehiculo?.anio ?? new Date().getFullYear(),
      patente: vehiculo?.patente ?? "",
      chasis: vehiculo?.chasis ?? "",
      motor: vehiculo?.motor ?? "",
    },
  });

  // Combustión: hasta 2 (ej. "Nafta / GNC"), igual que en el Alta.
  const [comb, setComb] = useState<string[]>(
    vehiculo?.combustion ? vehiculo.combustion.split("/").map((s) => s.trim()).filter(Boolean).slice(0, 2) : []
  );
  const toggle = (k: string) =>
    setComb((cur) => (cur.includes(k) ? cur.filter((x) => x !== k) : cur.length >= 2 ? cur : [...cur, k]));

  return (
    <form onSubmit={handleSubmit((v) => onSubmit({ ...v, combustion: comb.length ? comb.join(" / ") : undefined }))}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Marca" error={errors.marca?.message}><Input {...register("marca")} placeholder="Toyota" /></Field>
        <Field label="Modelo" error={errors.modelo?.message}><Input {...register("modelo")} placeholder="Corolla" /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Año" error={errors.anio?.message}><Input type="number" {...register("anio")} /></Field>
        <Field label="Patente" error={errors.patente?.message}>
          <Input {...register("patente")} placeholder="AB123CD" disabled={editar}
            style={editar ? { background: "var(--canvas)", color: "var(--ink-500)" } : undefined} />
        </Field>
      </div>
      <Field label="Tipo de combustión" error={undefined}>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {COMBUSTIBLES.map((k) => {
            const sel = comb.includes(k);
            const maxed = !sel && comb.length >= 2;
            return (
              <button type="button" key={k} onClick={() => toggle(k)} disabled={maxed}
                style={{
                  padding: "9px 14px", borderRadius: 9, cursor: maxed ? "not-allowed" : "pointer",
                  border: "1.5px solid " + (sel ? "var(--navy-900)" : "var(--line)"),
                  background: sel ? "var(--blue-100)" : "var(--paper)",
                  color: sel ? "var(--navy-900)" : maxed ? "var(--ink-400)" : "var(--ink-700)",
                  fontSize: 13.5, fontWeight: 500, opacity: maxed ? 0.55 : 1,
                }}>
                {sel ? "✓ " : ""}{k}
              </button>
            );
          })}
        </div>
      </Field>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="N° de chasis" error={errors.chasis?.message}><Input {...register("chasis")} /></Field>
        <Field label="N° de motor" error={errors.motor?.message}><Input {...register("motor")} /></Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="submit" disabled={enviando}>{enviando ? "Guardando…" : editar ? "Guardar cambios" : "Agregar vehículo"}</Button>
      </div>
    </form>
  );
}
