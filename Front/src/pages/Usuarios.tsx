import { useState, type CSSProperties } from "react";
import {
  useUsuarios, useCrearUsuario, useSolicitudesReset, useAutorizarReset,
  useOficinas, useCrearOficina, useEliminarOficina,
  useAsignarOficinaUsuario, useDarDeBajaUsuario,
} from "../hooks/admin";
import type { CrearUsuarioDto } from "../api/usuarios";
import type { Rol } from "../types";
import Button from "../components/ui/Button";
import PageHeader from "../components/ui/PageHeader";
import Modal from "../components/ui/Modal";
import { Field, Input, Select } from "../components/ui/Field";
import { Cargando, VacioState, ErrorState } from "../components/ui/States";
import { formatFecha } from "../utils/format";

export default function Usuarios() {
  const usuarios = useUsuarios();
  const solicitudes = useSolicitudesReset();
  const crear = useCrearUsuario();
  const autorizar = useAutorizarReset();

  const oficinas = useOficinas();
  const crearOficina = useCrearOficina();
  const eliminarOficina = useEliminarOficina();
  const asignarOficina = useAsignarOficinaUsuario();
  const darDeBaja = useDarDeBajaUsuario();

  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<CrearUsuarioDto>({ nombre: "", email: "", password: "", rol: "Productor" });
  const [error, setError] = useState<string>();
  const [nuevaOficina, setNuevaOficina] = useState("");
  const [baja, setBaja] = useState<{ id: number; nombre: string } | null>(null);

  function set<K extends keyof CrearUsuarioDto>(k: K, v: CrearUsuarioDto[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function crearUsuario() {
    setError(undefined);
    if (form.nombre.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
    if (!/^\S+@\S+\.\S+$/.test(form.email)) return setError("Email inválido.");
    if (form.password.length < 8) return setError("La contraseña debe tener al menos 8 caracteres.");
    try {
      await crear.mutateAsync({ ...form, nombre: form.nombre.trim(), email: form.email.trim() });
      setModal(false);
      setForm({ nombre: "", email: "", password: "", rol: "Productor" });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo crear el usuario.");
    }
  }

  async function agregarOficina() {
    const n = nuevaOficina.trim();
    if (n.length < 2) return;
    await crearOficina.mutateAsync(n);
    setNuevaOficina("");
  }

  const pendientes = solicitudes.data ?? [];
  const listaOficinas = oficinas.data ?? [];

  return (
    <div>
      <PageHeader
        titulo="Vendedores y usuarios"
        subtitulo="Gestión de accesos, oficinas y autorización de cambios de contraseña."
        accion={<Button onClick={() => { setError(undefined); setModal(true); }}>Nuevo usuario</Button>}
      />

      {/* Oficinas */}
      <div style={{ ...card, marginBottom: 18 }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 4px" }}>Oficinas</h2>
        <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ink-500)" }}>
          Cada usuario ve los clientes, pólizas y cobranzas de su oficina (y los que se le compartan). El Admin ve todo.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
          {listaOficinas.map((o) => (
            <span key={o.id} style={oficinaTag}>
              {o.nombre}
              <button title="Eliminar oficina" onClick={() => eliminarOficina.mutate(o.id)}
                style={{ border: 0, background: "transparent", color: "var(--ink-400)", cursor: "pointer", fontSize: 15, lineHeight: 1, padding: 0 }}>×</button>
            </span>
          ))}
          {listaOficinas.length === 0 && !oficinas.isLoading && (
            <span style={{ fontSize: 13, color: "var(--ink-400)" }}>Sin oficinas. Agregá la primera para empezar a segmentar.</span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8, maxWidth: 420 }}>
          <Input value={nuevaOficina} onChange={(e) => setNuevaOficina(e.target.value)}
            placeholder="Nombre de la oficina (ej: Sucursal Centro)"
            onKeyDown={(e) => { if (e.key === "Enter") agregarOficina(); }} />
          <Button onClick={agregarOficina} disabled={crearOficina.isPending}>Agregar</Button>
        </div>
      </div>

      {/* Solicitudes de reset pendientes */}
      {pendientes.length > 0 && (
        <div style={{ ...card, marginBottom: 18, borderColor: "var(--warn-500)", background: "var(--warn-100)" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, margin: "0 0 12px", color: "var(--warn-700)" }}>
            Solicitudes de cambio de contraseña ({pendientes.length})
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pendientes.map((s) => (
              <div key={s.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: "10px 14px" }}>
                <div>
                  <span style={{ fontWeight: 600 }}>{s.usuarioNombre}</span>
                  <span style={{ color: "var(--ink-500)", fontSize: 13 }}> · {s.email} · {formatFecha(s.fechaSolicitud)}</span>
                </div>
                <Button
                  onClick={() => autorizar.mutate(s.id)}
                  disabled={autorizar.isPending}
                  style={{ height: 34, padding: "0 14px", fontSize: 13 }}
                >
                  Autorizar cambio
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabla de usuarios */}
      <div style={{ ...card, padding: 0, overflow: "hidden" }}>
        {usuarios.isLoading ? (
          <Cargando />
        ) : usuarios.isError ? (
          <ErrorState />
        ) : !usuarios.data || usuarios.data.length === 0 ? (
          <VacioState mensaje="No hay usuarios." />
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th style={th}>Nombre</th>
                <th style={th}>Email</th>
                <th style={th}>Rol</th>
                <th style={th}>Oficina</th>
                <th style={th}>Estado</th>
                <th style={th}>Alta</th>
                <th style={th}></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.data.map((u) => (
                <tr key={u.id} style={{ borderTop: "1px solid var(--line-2)" }}>
                  <td style={{ ...td, fontWeight: 600 }}>{u.nombre}</td>
                  <td style={{ ...td, color: "var(--ink-700)" }}>{u.email}</td>
                  <td style={td}>
                    <span style={chip(u.rol === "Admin" ? "var(--blue-600)" : "var(--ink-700)", u.rol === "Admin" ? "var(--blue-100)" : "var(--line-2)")}>{u.rol}</span>
                  </td>
                  <td style={td}>
                    <Select
                      value={u.oficinaId ?? ""}
                      onChange={(e) => asignarOficina.mutate({ usuarioId: u.id, oficinaId: e.target.value === "" ? null : Number(e.target.value) })}
                      style={{ minWidth: 150, height: 34, fontSize: 13 }}
                    >
                      <option value="">— Sin oficina —</option>
                      {listaOficinas.map((o) => <option key={o.id} value={o.id}>{o.nombre}</option>)}
                    </Select>
                  </td>
                  <td style={td}>
                    <span style={chip(u.activo ? "var(--ok-700)" : "var(--bad-700)", u.activo ? "var(--ok-100)" : "var(--bad-100)")}>
                      {u.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td style={{ ...td, color: "var(--ink-500)" }}>{formatFecha(u.fechaAlta)}</td>
                  <td style={{ ...td, textAlign: "right" }}>
                    <button title="Dar de baja" onClick={() => setBaja({ id: u.id, nombre: u.nombre })}
                      style={{ height: 32, padding: "0 12px", borderRadius: 8, border: "1px solid oklch(0.85 0.08 28)", background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                      Dar de baja
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <Modal titulo="Nuevo usuario" onClose={() => setModal(false)}>
          {error && <Banner mensaje={error} />}
          <Field label="Nombre"><Input value={form.nombre} onChange={(e) => set("nombre", e.target.value)} placeholder="Nombre y apellido" /></Field>
          <Field label="Email"><Input value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="usuario@amr.com" /></Field>
          <Field label="Contraseña"><Input type="password" value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="Mínimo 8 caracteres" /></Field>
          <Field label="Rol">
            <Select value={form.rol} onChange={(e) => set("rol", e.target.value as Rol)}>
              <option value="Productor">Productor (vendedor)</option>
              <option value="Admin">Admin</option>
            </Select>
          </Field>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 8 }}>
            <Button variant="secondary" onClick={() => setModal(false)}>Cancelar</Button>
            <Button onClick={crearUsuario} disabled={crear.isPending}>{crear.isPending ? "Creando…" : "Crear usuario"}</Button>
          </div>
        </Modal>
      )}

      {baja && (
        <Modal titulo="Dar de baja usuario" onClose={() => setBaja(null)}>
          <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--ink-700)" }}>
            ¿Seguro que querés dar de baja a <strong>{baja.nombre}</strong>? No podrá volver a iniciar sesión.
          </p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Button variant="secondary" onClick={() => setBaja(null)}>Cancelar</Button>
            <Button
              onClick={async () => { await darDeBaja.mutateAsync(baja.id); setBaja(null); }}
              disabled={darDeBaja.isPending}
              style={{ background: "var(--bad-700)" }}
            >
              {darDeBaja.isPending ? "Dando de baja…" : "Dar de baja"}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Banner({ mensaje }: { mensaje: string }) {
  return <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{mensaje}</div>;
}
function chip(color: string, bg: string): CSSProperties {
  return { display: "inline-block", padding: "3px 10px", borderRadius: 999, fontSize: 12, fontWeight: 600, color, background: bg };
}
const card: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: "var(--r-lg)", padding: 18 };
const th: CSSProperties = { textAlign: "left", padding: "12px 16px", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--ink-400)", background: "var(--canvas)" };
const td: CSSProperties = { padding: "13px 16px", fontSize: 14 };
const oficinaTag: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 8px 5px 12px", borderRadius: 999, fontSize: 13, fontWeight: 500, background: "var(--blue-50)", border: "1px solid var(--line)", color: "var(--ink-900)" };
