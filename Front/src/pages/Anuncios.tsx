import { useEffect, useRef, useState, type CSSProperties, type FormEvent } from "react";
import PageHeader from "../components/ui/PageHeader";
import Button from "../components/ui/Button";
import Pagination from "../components/ui/Pagination";
import { Field, Input } from "../components/ui/Field";
import { Cargando, ErrorState, VacioState } from "../components/ui/States";
import { IconBell, IconTrash } from "../components/Icons";
import { useAuth } from "../auth/AuthContext";
import { useAnuncios, useCrearAnuncio, useEliminarAnuncio, useMarcarAnunciosVistos } from "../hooks/anuncios";
import { formatFechaHora } from "../utils/format";

const PAGE_SIZE = 10;

export default function Anuncios() {
  const { esAdmin } = useAuth();
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useAnuncios(page, PAGE_SIZE);
  const crear = useCrearAnuncio();
  const eliminar = useEliminarAnuncio();
  const marcarVistos = useMarcarAnunciosVistos();

  const [titulo, setTitulo] = useState("");
  const [subtitulo, setSubtitulo] = useState("");
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string>();
  const yaMarque = useRef(false);

  // Al abrir la página y cargar la lista, los anuncios visibles quedan leídos.
  // Se marca sólo hasta el último Id mostrado (no los que se publiquen después).
  useEffect(() => {
    if (yaMarque.current || !data) return;
    yaMarque.current = true;

    const maxId = data.items[0]?.id ?? 0;
    if (maxId <= 0) return;

    marcarVistos.mutateAsync(maxId)
      .then(() => {
        try {
          const canal = new BroadcastChannel("amr-anuncios");
          canal.postMessage("vistos");
          canal.close();
        } catch { /* navegador sin BroadcastChannel */ }
      })
      .catch(() => { /* el polling de la campanita cubre el fallo */ });
  }, [data, marcarVistos]);

  async function publicar(e: FormEvent) {
    e.preventDefault();
    setError(undefined);
    const t = titulo.trim();
    const s = subtitulo.trim();
    const x = texto.trim();

    if (!t) {
      setError("El título es obligatorio.");
      return;
    }
    if (!x) {
      setError("El texto es obligatorio.");
      return;
    }

    try {
      await crear.mutateAsync({ titulo: t, subtitulo: s || undefined, texto: x });
      setTitulo("");
      setSubtitulo("");
      setTexto("");
      setPage(1);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo publicar el anuncio.");
    }
  }

  async function borrar(id: number) {
    if (!confirm("¿Eliminar este anuncio? Esta acción no se puede deshacer.")) return;
    setError(undefined);
    try {
      await eliminar.mutateAsync(id);
      if (data && data.items.length === 1 && page > 1) setPage(page - 1);
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo eliminar el anuncio.");
    }
  }

  return (
    <div style={{ maxWidth: 900 }}>
      <PageHeader
        titulo="Anuncios"
        subtitulo="Novedades y avisos internos del equipo."
      />

      {esAdmin && (
        <form onSubmit={publicar} style={{ ...card, marginBottom: 22 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <span style={iconBox}><IconBell size={18} /></span>
            <div>
              <div style={{ fontWeight: 600, fontSize: 16 }}>Publicar anuncio</div>
              <div style={{ fontSize: 13, color: "var(--ink-500)" }}>Visible para todos los usuarios del portal.</div>
            </div>
          </div>

          <Field label="Título *">
            <Input
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              maxLength={120}
              placeholder="Ej. Nueva compañía disponible"
            />
          </Field>

          <Field label="Subtítulo">
            <Input
              value={subtitulo}
              onChange={(e) => setSubtitulo(e.target.value)}
              maxLength={200}
              placeholder="Opcional: una línea de resumen"
            />
          </Field>

          <Field label="Texto *">
            <textarea
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              maxLength={5000}
              rows={7}
              placeholder="Escribí el anuncio. Podés usar saltos de línea."
              style={textarea}
            />
          </Field>

          {error && <div style={errBox}>{error}</div>}

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{texto.length}/5000</span>
            <Button type="submit" disabled={crear.isPending}>
              {crear.isPending ? "Publicando…" : "Publicar anuncio"}
            </Button>
          </div>
        </form>
      )}

      {!esAdmin && error && <div style={errBox}>{error}</div>}

      {isLoading ? (
        <Cargando />
      ) : isError ? (
        <ErrorState mensaje="No se pudieron cargar los anuncios." />
      ) : !data || data.items.length === 0 ? (
        <VacioState mensaje="Todavía no hay anuncios publicados." />
      ) : (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {data.items.map((a) => (
              <article key={a.id} style={card}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ minWidth: 0 }}>
                    <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, color: "var(--ink-900)", overflowWrap: "anywhere" }}>
                      {a.titulo}
                    </h2>
                    {a.subtitulo && (
                      <div style={{ marginTop: 4, fontSize: 14, color: "var(--ink-500)", overflowWrap: "anywhere" }}>
                        {a.subtitulo}
                      </div>
                    )}
                  </div>
                  {esAdmin && (
                    <button
                      type="button"
                      onClick={() => void borrar(a.id)}
                      disabled={eliminar.isPending}
                      title="Eliminar anuncio"
                      style={deleteButton}
                    >
                      <IconTrash size={15} />
                    </button>
                  )}
                </div>

                <div style={textoStyle}>{a.texto}</div>

                <div style={meta}>
                  <span>
                    Publicado por <strong>{a.usuarioNombre ?? "—"}</strong>
                    {a.usuarioEmail ? <> · {a.usuarioEmail}</> : null}
                  </span>
                  <span>{formatFechaHora(a.fechaPublicacion)}</span>
                </div>
              </article>
            ))}
          </div>

          {data.total > PAGE_SIZE && (
            <Pagination page={page} pageSize={PAGE_SIZE} total={data.total} onPage={setPage} />
          )}
        </>
      )}
    </div>
  );
}

const card: CSSProperties = {
  background: "var(--paper)",
  border: "1px solid var(--line)",
  borderRadius: 14,
  padding: "18px 20px",
  boxShadow: "var(--shadow-sm)",
};
const iconBox: CSSProperties = {
  width: 38, height: 38, borderRadius: 10, background: "var(--blue-100)",
  color: "var(--navy-900)", display: "grid", placeItems: "center", flexShrink: 0,
};
const textarea: CSSProperties = {
  width: "100%", boxSizing: "border-box", resize: "vertical", minHeight: 140,
  padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--line)", outline: 0,
  fontFamily: "inherit", fontSize: 14, color: "var(--ink-900)", background: "var(--paper)",
  lineHeight: 1.5,
};
const textoStyle: CSSProperties = {
  marginTop: 14,
  fontSize: 14.5,
  lineHeight: 1.6,
  color: "var(--ink-900)",
  whiteSpace: "pre-wrap",
  overflowWrap: "anywhere",
};
const meta: CSSProperties = {
  marginTop: 16,
  paddingTop: 12,
  borderTop: "1px solid var(--line-2)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
  fontSize: 12.5,
  color: "var(--ink-500)",
};
const deleteButton: CSSProperties = {
  width: 34, height: 34, borderRadius: 8, border: "1px solid var(--bad-200)",
  background: "var(--bad-100)", color: "var(--bad-700)", cursor: "pointer",
  display: "grid", placeItems: "center", flexShrink: 0,
};
const errBox: CSSProperties = {
  margin: "0 0 12px", padding: "10px 14px", background: "var(--bad-100)",
  border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)",
};
