import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input, Select } from "../ui/Field";
import Button from "../ui/Button";
import { useCoberturas } from "../../hooks/admin";
import type { Poliza, Compania } from "../../types";
import type { RenovarPolizaDto } from "../../api/polizas";

const schema = z
  .object({
    companiaId: z.coerce.number().int().positive(),
    cobertura: z.string().min(1, "Elegí una cobertura"),
    fechaInicio: z.string().min(1, "Requerido"),
    fechaFin: z.string().min(1, "Requerido"),
    precioCuota: z.coerce.number().positive("Debe ser mayor a 0"),
    cantidadCuotas: z.coerce.number().int().min(1).max(3),
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
  const { data: coberturas = [] } = useCoberturas();

  // Precio de cada cuota por defecto = precio total actual / cantidad de cuotas actual.
  const cuotaActual = Math.round((poliza.precioTotal / Math.max(1, poliza.cantidadCuotas)) * 100) / 100;
  const cuotasDefault = [1, 2, 3].includes(poliza.cantidadCuotas) ? poliza.cantidadCuotas : 1;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      companiaId: poliza.companiaId,
      cobertura: poliza.cobertura ?? "",
      fechaInicio: isoHoy(),
      fechaFin: isoMasUnAnio(),
      precioCuota: cuotaActual,
      cantidadCuotas: cuotasDefault,
      primaOG: poliza.primaOG ?? undefined,
    },
  });

  // La cobertura actual puede no estar en el catálogo: la agregamos como opción para no perderla.
  const nombresCob = coberturas.map((c) => c.nombre);
  const opcionesCob = poliza.cobertura && !nombresCob.includes(poliza.cobertura)
    ? [poliza.cobertura, ...nombresCob]
    : nombresCob;

  function enviar(v: Values) {
    return onSubmit({
      companiaId: v.companiaId,
      cobertura: v.cobertura,
      fechaInicio: v.fechaInicio,
      fechaFin: v.fechaFin,
      precioTotal: Math.round(v.precioCuota * v.cantidadCuotas * 100) / 100,
      cantidadCuotas: v.cantidadCuotas,
      primaOG: v.primaOG,
    });
  }

  return (
    <form onSubmit={handleSubmit(enviar)}>
      <p style={{ marginTop: 0, fontSize: 13.5, color: "var(--ink-500)" }}>
        Se creará una nueva póliza y la actual quedará marcada como <strong>Renovada</strong>.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Compañía" error={errors.companiaId?.message}>
          <Select {...register("companiaId")}>
            {companias.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </Select>
        </Field>
        <Field label="Cobertura" error={errors.cobertura?.message}>
          <Select {...register("cobertura")}>
            {opcionesCob.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Fecha inicio" error={errors.fechaInicio?.message}>
          <Input type="date" {...register("fechaInicio")} />
        </Field>
        <Field label="Fecha fin" error={errors.fechaFin?.message}>
          <Input type="date" {...register("fechaFin")} />
        </Field>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        <Field label="Precio por cuota" error={errors.precioCuota?.message}>
          <Input type="number" step="0.01" {...register("precioCuota")} />
        </Field>
        <Field label="Período de cuotas" error={errors.cantidadCuotas?.message}>
          <Select {...register("cantidadCuotas")}>
            <option value={1}>Una</option>
            <option value={2}>Dos</option>
            <option value={3}>Tres</option>
          </Select>
        </Field>
      </div>

      <Field label="Prima OG (por cuota, interna)" error={errors.primaOG?.message}>
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
