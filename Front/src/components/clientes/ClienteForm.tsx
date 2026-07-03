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

export type ClienteFormValues = z.infer<typeof schema>;

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
  } = useForm<ClienteFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: cliente?.nombre ?? "",
      documento: cliente?.documento ?? "",
      email: cliente?.email ?? "",
      telefono: cliente?.telefono ?? "",
      direccion: cliente?.direccion ?? "",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
