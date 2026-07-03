import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input, Select } from "../ui/Field";
import Button from "../ui/Button";
import type { Vehiculo } from "../../types";

const COBERTURAS = ["Terceros", "Terceros completo", "Todo riesgo"];

const schema = z.object({
  marca: z.string().min(1, "Requerido").max(60),
  modelo: z.string().min(1, "Requerido").max(60),
  anio: z.coerce.number().int().min(1950, "Año inválido").max(new Date().getFullYear() + 1, "Año inválido"),
  patente: z.string().min(1, "Requerido").max(10),
  chasis: z.string().max(50).optional().or(z.literal("")),
  motor: z.string().max(50).optional().or(z.literal("")),
  tipoCobertura: z.string().optional().or(z.literal("")),
});

export type VehiculoFormValues = z.infer<typeof schema>;

interface Props {
  vehiculo?: Vehiculo;
  onSubmit: (v: VehiculoFormValues) => Promise<void> | void;
  enviando: boolean;
}

export default function VehiculoForm({ vehiculo, onSubmit, enviando }: Props) {
  const editar = !!vehiculo;
  const { register, handleSubmit, formState: { errors } } = useForm<VehiculoFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      marca: vehiculo?.marca ?? "",
      modelo: vehiculo?.modelo ?? "",
      anio: vehiculo?.anio ?? new Date().getFullYear(),
      patente: vehiculo?.patente ?? "",
      chasis: vehiculo?.chasis ?? "",
      motor: vehiculo?.motor ?? "",
      tipoCobertura: vehiculo?.tipoCobertura ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
      <Field label="Tipo de cobertura" error={errors.tipoCobertura?.message}>
        <Select {...register("tipoCobertura")}>
          <option value="">— Sin especificar —</option>
          {COBERTURAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </Select>
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
