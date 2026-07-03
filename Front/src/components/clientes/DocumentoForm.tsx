import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Field, Input } from "../ui/Field";
import Button from "../ui/Button";

const schema = z.object({
  documento: z.string().regex(/^\d{7,11}$/, "El documento debe tener 7 a 11 dígitos"),
});

type Values = z.infer<typeof schema>;

interface Props {
  documentoActual: string;
  onSubmit: (documento: string) => Promise<void> | void;
  enviando: boolean;
}

export default function DocumentoForm({ documentoActual, onSubmit, enviando }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { documento: documentoActual },
  });

  return (
    <form onSubmit={handleSubmit((v) => onSubmit(v.documento))}>
      <p style={{ marginTop: 0, fontSize: 13.5, color: "var(--ink-500)" }}>
        La corrección del documento queda registrada en la auditoría del sistema.
      </p>
      <Field label="Nuevo documento" error={errors.documento?.message}>
        <Input {...register("documento")} placeholder="30111222" />
      </Field>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
        <Button type="submit" variant="danger" disabled={enviando}>
          {enviando ? "Guardando…" : "Corregir documento"}
        </Button>
      </div>
    </form>
  );
}
