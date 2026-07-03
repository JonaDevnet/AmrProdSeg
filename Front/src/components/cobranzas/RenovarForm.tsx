import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input, Select } from "../ui/Field";
import Button from "../ui/Button";
import type { Poliza, Compania } from "../../types";
import type { RenovarPolizaDto } from "../../api/polizas";

const schema = z
  .object({
    companiaId: z.coerce.number().int().positive(),
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
    precioTotal: z.coerce.number().positive("Debe ser mayor a 0"),
    cantidadCuotas: z.coerce.number().int().min(1).max(24, "Entre 1 y 24"),
    primaOG: z.coerce.number().min(0).optional(),
  })
  .refine((v) => v.fechaFin > v.fechaInicio, {
    message: "La fecha de fin debe ser posterior a la de inicio",
    path: ["fechaFin"],
  });

type Values = z.infer<typeof schema>;

function isoHoy() {
  return new Date().toISOString().slice(0, 10);
}
function isoMasUnAnio() {
  const d = new Date();
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().slice(0, 10);
}

interface Props {
  poliza: Poliza;
  companias: Compania[];
  onSubmit: (dto: RenovarPolizaDto) => Promise<void> | void;
  enviando: boolean;
}

export default function RenovarForm({ poliza, companias, onSubmit, enviando }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      companiaId: poliza.companiaId,
      fechaInicio: isoHoy(),
      fechaFin: isoMasUnAnio(),
      precioTotal: poliza.precioTotal,
      cantidadCuotas: poliza.cantidadCuotas,
      primaOG: poliza.primaOG ?? undefined,
    },
  });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v))}>
      <p style={{ marginTop: 0, fontSize: 13.5, color: "var(--ink-500)" }}>
        Se creará una nueva póliza y la actual quedará marcada como <strong>Renovada</strong>.
      </p>

      <Field label="Compañía" error={errors.companiaId?.message}>
        <Select {...register("companiaId")}>
          {companias.map((c) => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </Select>
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Fecha inicio" error={errors.fechaInicio?.message}>
          <Input type="date" {...register("fechaInicio")} />
        </Field>
        <Field label="Fecha fin" error={errors.fechaFin?.message}>
          <Input type="date" {...register("fechaFin")} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Precio total" error={errors.precioTotal?.message}>
          <Input type="number" step="0.01" {...register("precioTotal")} />
        </Field>
        <Field label="Cantidad de cuotas" error={errors.cantidadCuotas?.message}>
          <Input type="number" {...register("cantidadCuotas")} />
        </Field>
      </div>

      <Field label="Prima OG (interna)" error={errors.primaOG?.message}>
        <Input type="number" step="0.01" placeholder="Prima real de la compañía" {...register("primaOG")} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="submit" disabled={enviando}>
          {enviando ? "Renovando…" : "Renovar póliza"}
        </Button>
      </div>
    </form>
  );
}
