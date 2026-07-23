import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input, Select } from "../ui/Field";
import Button from "../ui/Button";
import { useCoberturas } from "../../hooks/admin";
import { formatFecha } from "../../utils/format";
import type { Poliza, Compania } from "../../types";
import type { RenovarPolizaDto } from "../../api/polizas";

const schema = z
  .object({
    numero: z.string().min(1, "Requerido").max(20),
    companiaId: z.coerce.number().int().positive(),
    cobertura: z.string().min(1, "Elegí una cobertura"),
    inicioPoliza: z.string().optional(), // solo aplica cuando el período terminó (renovación real)
    precioCuota: z.coerce.number().positive("Debe ser mayor a 0"),
    cantidadCuotas: z.coerce.number().int().min(1).max(3),
    primaOG: z.coerce.number().min(0).optional(),
  });

type Values = z.infer<typeof schema>;

function isoHoy() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function addMesesISO(iso: string, meses: number) {
  const [y, m, d] = (iso || isoHoy()).split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCMonth(base.getUTCMonth() + meses);
  return base.toISOString().slice(0, 10);
}
function mesesEntre(desde: string, hasta: string): number {
  const a = new Date(desde + "T00:00:00Z"), b = new Date(hasta + "T00:00:00Z");
  let m = (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
  if (b.getUTCDate() < a.getUTCDate()) m -= 1;
  return m;
}

interface Props {
  poliza: Poliza;
  companias: Compania[];
  /** Vencimiento de la ÚLTIMA cuota de la póliza original (para continuar el patrón = +1 mes). */
  ultimaCuotaOriginal?: string;
  onSubmit: (dto: RenovarPolizaDto) => Promise<void> | void;
  enviando: boolean;
}

export default function RenovarForm({ poliza, companias, ultimaCuotaOriginal, onSubmit, enviando }: Props) {
  const { data: coberturas = [] } = useCoberturas();

  const cuotaActual = Math.round((poliza.precioTotal / Math.max(1, poliza.cantidadCuotas)) * 100) / 100;
  const cuotasDefault = [1, 2, 3].includes(poliza.cantidadCuotas) ? poliza.cantidadCuotas : 1;

  const fechaInicioOriginal = poliza.fechaInicio.slice(0, 10);
  const fechaFinOriginal = poliza.fechaFin.slice(0, 10);
  // Si la vigencia (período de póliza) ya terminó → RENOVACIÓN: fecha nueva editable.
  // Si sigue vigente → REFACTURACIÓN: solo se renuevan las cuotas, continúan desde la última
  // (+1 mes) y se hereda la vigencia (misma fecha fin).
  const periodoTerminado = isoHoy() >= fechaFinOriginal;
  const periodoMeses = Math.max(1, mesesEntre(fechaInicioOriginal, fechaFinOriginal));
  // 1ª cuota de la refacturación = última cuota original + 1 mes (continúa el mismo día).
  const primerVencContinuado = addMesesISO(ultimaCuotaOriginal ?? isoHoy(), 1);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: {
      numero: poliza.numero,
      companiaId: poliza.companiaId,
      cobertura: poliza.cobertura ?? "",
      inicioPoliza: isoHoy(),
      precioCuota: cuotaActual,
      cantidadCuotas: cuotasDefault,
      primaOG: poliza.primaOG ?? undefined,
    },
  });

  const nombresCob = coberturas.map((c) => c.nombre);
  const opcionesCob = poliza.cobertura && !nombresCob.includes(poliza.cobertura)
    ? [poliza.cobertura, ...nombresCob]
    : nombresCob;

  const cantidad = Math.max(1, Math.min(3, Number(watch("cantidadCuotas")) || cuotasDefault));
  // Vista previa de las fechas de cuotas del resultado.
  const primerVencPreview = periodoTerminado ? addMesesISO(watch("inicioPoliza") || isoHoy(), 1) : primerVencContinuado;
  const cuotasPreview = Array.from({ length: cantidad }, (_, i) => addMesesISO(primerVencPreview, i));

  function enviar(v: Values) {
    let fechaInicio: string, fechaFin: string, primerVenc: string;
    if (periodoTerminado) {
      // Renovación: nueva vigencia desde la fecha elegida (mismo largo de período que la original).
      fechaInicio = v.inicioPoliza || isoHoy();
      fechaFin = addMesesISO(fechaInicio, periodoMeses);
      primerVenc = addMesesISO(fechaInicio, 1);
    } else {
      // Refacturación: hereda la vigencia; las cuotas continúan desde la última + 1 mes.
      fechaInicio = fechaInicioOriginal;
      fechaFin = fechaFinOriginal;
      primerVenc = primerVencContinuado;
    }
    return onSubmit({
      numero: v.numero.trim(),
      companiaId: v.companiaId,
      cobertura: v.cobertura,
      fechaInicio,
      fechaFin,
      primerVencimiento: primerVenc,
      precioTotal: Math.round(v.precioCuota * v.cantidadCuotas * 100) / 100,
      cantidadCuotas: v.cantidadCuotas,
      primaOG: v.primaOG,
    });
  }

  const accion = periodoTerminado ? "Renovar" : "Refacturar";

  return (
    <form onSubmit={handleSubmit(enviar)}>
      <p style={{ marginTop: 0, fontSize: 13.5, color: "var(--ink-500)" }}>
        {periodoTerminado ? (
          <>El período de póliza <strong>terminó</strong>: se renueva con una <strong>vigencia nueva</strong> desde la fecha que elijas.</>
        ) : (
          <>La póliza sigue <strong>vigente</strong>: es una <strong>refacturación</strong> (solo se renuevan las cuotas).
          Se mantiene la vigencia (<span className="mono">{formatFecha(fechaInicioOriginal)} – {formatFecha(fechaFinOriginal)}</span>)
          y las cuotas continúan desde la última.</>
        )}
      </p>

      <Field label="Número de póliza" error={errors.numero?.message}>
        <Input {...register("numero")} placeholder="Número de la póliza renovada" />
      </Field>

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
        {periodoTerminado ? (
          <Field label="Inicio de la nueva vigencia" error={errors.inicioPoliza?.message}>
            <Input type="date" {...register("inicioPoliza")} />
          </Field>
        ) : (
          <Field label="1ª cuota (continúa el patrón)">
            <Input type="date" value={primerVencContinuado} readOnly disabled />
          </Field>
        )}
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

      <div style={{ fontSize: 12, color: "var(--ink-500)", margin: "2px 0 6px" }}>
        Cuotas: <strong className="mono">{cuotasPreview.map((c) => formatFecha(c)).join(" · ")}</strong>
      </div>

      <Field label="Prima OG (por cuota, interna)" error={errors.primaOG?.message}>
        <Input type="number" step="0.01" placeholder="Prima real de la compañía" {...register("primaOG")} />
      </Field>

      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="submit" disabled={enviando}>
          {enviando ? `${accion}ando…` : `${accion} póliza`}
        </Button>
      </div>
    </form>
  );
}
