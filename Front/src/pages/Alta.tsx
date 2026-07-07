// Portado de disenioAMR/amr_nueva_poliza.jsx — wizard de Nueva Póliza.
// 3 columnas: stepper (240) · card (1fr) · panel RESUMEN navy (320).
// Adaptado: ramos y compañías reales (catálogo del backend), alta atómica vía useCrearAlta.
// El "valor de cuota" + período de póliza/cuotas se convierten a precioTotal + cantidadCuotas.
import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useCompanias } from "../hooks/polizas";
import { useRamos, useCoberturas } from "../hooks/admin";
import { useCrearAlta } from "../hooks/altas";
import { listarClientes, getCliente } from "../api/clientes";
import { getVehiculoPorPatente } from "../api/vehiculos";
import { getPolizaActivaPorPatente } from "../api/polizas";
import type { AltaAsegurado } from "../types";
import {
  Icon, IconCar, IconShield, IconCheck, IconChevL, IconChevR, IconChevD, IconCal, IconMail, IconClose,
} from "../design/icons";
import { coColor } from "../design/companias";
import { useIsMobile } from "../hooks/useMediaQuery";

const PROVINCIAS = ["Buenos Aires", "CABA", "Córdoba", "Santa Fe", "Mendoza", "Tucumán", "Salta", "Entre Ríos", "Otra"];

const COMBUSTION_OPTS = [
  { k: "Nafta", color: "oklch(0.62 0.15 50)" },
  { k: "Diesel", color: "oklch(0.55 0.13 78)" },
  { k: "GNC", color: "oklch(0.55 0.14 250)" },
  { k: "Híbrido", color: "oklch(0.56 0.14 155)" },
  { k: "Eléctrico", color: "oklch(0.58 0.15 220)" },
];

const PERIODO_POLIZA: Record<string, number> = {
  "1 mes (mensual)": 1, "2 meses (bimestral)": 2, "3 meses (trimestral)": 3,
  "4 meses (cuatrimestral)": 4, "6 meses (semestral)": 6, "9 meses": 9, "12 meses (anual)": 12,
};
const PERIODO_CUOTAS: Record<string, number> = { Una: 1, Dos: 2, Tres: 3 };

const norm = (s: string) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

function ramoIcon(nombre: string): ReactNode {
  const n = norm(nombre);
  if (n.includes("auto")) return <IconCar size={16} />;
  if (n.includes("moto")) return <Icon size={16} d={<><circle cx="5.5" cy="16.5" r="3" /><circle cx="18.5" cy="16.5" r="3" /><path d="M5.5 16.5h7l3-5h4l-2-4h-3" /><path d="M14 6h3" /></>} />;
  if (n.includes("hogar")) return <Icon size={16} d={<><path d="M3 11 12 4l9 7" /><path d="M5 10v9h14v-9" /></>} />;
  if (n.includes("vida")) return <Icon size={16} d="M20.84 4.6a5 5 0 0 0-7.08 0L12 6.34l-1.76-1.74a5 5 0 0 0-7.08 7.08l1.76 1.76L12 21l7.08-7.56 1.76-1.76a5 5 0 0 0 0-7.08Z" />;
  if (n.includes("comerc")) return <Icon size={16} d={<><path d="M3 9h18l-1 11H4L3 9Z" /><path d="M8 9V6a4 4 0 0 1 8 0v3" /></>} />;
  if (n.includes("cauc")) return <Icon size={16} d={<><path d="M12 2 4 5v6c0 5 3 8 8 9 5-1 8-4 8-9V5l-8-3Z" /><path d="m9 12 2 2 4-4" /></>} />;
  return <IconShield size={16} />;
}

function isoHoy() { return new Date().toISOString().slice(0, 10); }
function isoEnMeses(meses: number) { const d = new Date(); d.setMonth(d.getMonth() + meses); return d.toISOString().slice(0, 10); }

interface Form {
  idType: string; idNumber: string; nombre: string; apellido: string; nac: string;
  telefono: string; email: string;
  calle: string; numero: string; piso: string; localidad: string; provincia: string;
  patente: string; marca: string; modelo: string; anio: string; chasis: string; motor: string; combustion: string[];
  companiaNombre: string; ramoId: string; ramoNombre: string; cobertura: string;
  vencimiento: string; periodoPoliza: string; periodoCuotas: string; cuota: string; formaPago: string; primaOG: string;
}

const FORM0: Form = {
  idType: "DNI", idNumber: "", nombre: "", apellido: "", nac: "",
  telefono: "", email: "",
  calle: "", numero: "", piso: "", localidad: "", provincia: "",
  patente: "", marca: "", modelo: "", anio: "", chasis: "", motor: "", combustion: [],
  companiaNombre: "", ramoId: "", ramoNombre: "", cobertura: "",
  vencimiento: isoEnMeses(1), periodoPoliza: "12 meses (anual)", periodoCuotas: "Mensual", cuota: "", formaPago: "Débito automático", primaOG: "",
};

export default function Alta() {
  const navigate = useNavigate();
  const mobile = useIsMobile();
  const { data: companias = [] } = useCompanias();
  const { data: ramos = [] } = useRamos();
  const { data: coberturas = [] } = useCoberturas();
  const crear = useCrearAlta();

  const [form, setForm] = useState<Form>(FORM0);
  const [step, setStep] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [saved, setSaved] = useState(false);
  const [polNum, setPolNum] = useState("");
  const [avisoPatente, setAvisoPatente] = useState("");
  const [patenteInfo, setPatenteInfo] = useState("");

  const set = (k: keyof Form) => (v: string | string[]) => setForm((p) => ({ ...p, [k]: v }));

  // Si el DNI corresponde a un asegurado existente, autocompleta sus datos.
  async function autocompletarPorDni() {
    const doc = form.idNumber.replace(/\D/g, "");
    if (!/^\d{7,11}$/.test(doc)) return;
    try {
      const res = await listarClientes(doc, 1, 5);
      const c = res.items.find((x) => x.documento === doc);
      if (!c) return;
      const [nom, ...resto] = c.nombre.trim().split(/\s+/);
      setForm((f) => ({
        ...f,
        nombre: nom ?? f.nombre,
        apellido: resto.join(" ") || f.apellido,
        email: c.email ?? f.email,
        telefono: c.telefono ?? f.telefono,
        idType: c.tipoDocumento ?? f.idType,
      }));
    } catch { /* silencioso */ }
  }

  // Al cargar la patente: si el vehículo ya existe, autocompleta sus datos (y los del
  // titular). Además avisa si ya tiene una póliza vigente (mostrando su número).
  async function chequearPatente() {
    const pat = form.patente.trim().toUpperCase();
    setAvisoPatente(""); setPatenteInfo("");
    if (!pat) return;

    // Autocompletar datos del vehículo ya registrado
    try {
      const veh = await getVehiculoPorPatente(pat);
      if (veh) {
        setForm((f) => ({
          ...f,
          marca: veh.marca || f.marca,
          modelo: veh.modelo || f.modelo,
          anio: veh.anio ? String(veh.anio) : f.anio,
          chasis: veh.chasis || f.chasis,
          motor: veh.motor || f.motor,
          cobertura: veh.tipoCobertura || f.cobertura,
          combustion: veh.combustion
            ? veh.combustion.split("/").map((s) => s.trim()).filter(Boolean)
                .map((v) => COMBUSTION_OPTS.find((o) => o.k.toLowerCase() === v.toLowerCase())?.k)
                .filter((x): x is string => !!x).slice(0, 2)
            : f.combustion,
        }));
        // Autocompletar el titular del vehículo (sin pisar lo que ya haya cargado)
        if (veh.clienteId) {
          try {
            const c = await getCliente(veh.clienteId);
            const [nom, ...resto] = (c.nombre || "").trim().split(/\s+/);
            setForm((f) => ({
              ...f,
              nombre: f.nombre || (nom ?? ""),
              apellido: f.apellido || resto.join(" "),
              idNumber: f.idNumber || (c.documento ?? ""),
              idType: c.tipoDocumento || f.idType,
              email: f.email || (c.email ?? ""),
              telefono: f.telefono || (c.telefono ?? ""),
            }));
          } catch { /* silencioso */ }
        }
        setPatenteInfo(`Se cargaron los datos del vehículo ${[veh.marca, veh.modelo].filter(Boolean).join(" ")} ya registrado.`);
      }
    } catch { /* silencioso */ }

    // Aviso de póliza vigente
    try {
      const pol = await getPolizaActivaPorPatente(pat);
      if (pol) setAvisoPatente(`El vehículo con patente ${pat} ya posee una póliza vigente: ${pol.numero}. Dala de baja antes de crear una nueva.`);
    } catch { /* silencioso */ }
  }

  // La vigencia de la póliza = cantidad de cuotas en meses (Mensual=1, Bimestral=2, Trimestral=3).
  // Ej: alta hoy 1/7 con Trimestral → vence 1/10 (3 meses). Se calcula solo; el campo es de lectura.
  useEffect(() => {
    const meses = PERIODO_CUOTAS[form.periodoCuotas] ?? 1;
    setForm((f) => ({ ...f, vencimiento: isoEnMeses(meses) }));
  }, [form.periodoCuotas]);

  // Wizard fijo de 3 pasos como el diseño. El vehículo es opcional (se omite si no
  // se carga patente), respetando multi-ramo.
  const steps = [
    { k: "cliente", l: "Datos del cliente", s: "DNI/CUIL, datos personales y domicilio" },
    { k: "vehiculo", l: "Datos del vehículo", s: "Patente, marca, modelo y motor" },
    { k: "poliza", l: "Detalles de póliza", s: "Compañía, ramo, cobertura y prima" },
  ];

  const stepKey = steps[Math.min(step, steps.length - 1)]?.k ?? "cliente";
  const esUltimo = step === steps.length - 1;
  const tieneVehiculo = !!form.patente.trim();
  const esCuponera = form.formaPago === "Cuponera";

  function fail(m: string) { setError(m); return false; }
  function validar(): boolean {
    setError(undefined);
    if (stepKey === "cliente") {
      if (form.nombre.trim().length < 2) return fail("Ingresá el nombre.");
      if (!/^\d{7,11}$/.test(form.idNumber.replace(/\D/g, ""))) return fail("Documento inválido (7 a 11 dígitos).");
    }
    if (stepKey === "vehiculo") {
      // Sección opcional: sólo validamos si se empezó a cargar el vehículo.
      if (form.patente.trim() && (!form.marca.trim() || !form.modelo.trim())) return fail("Completá marca y modelo del vehículo.");
    }
    if (stepKey === "poliza") {
      if (!form.ramoId) return fail("Elegí un ramo.");
      if (!form.companiaNombre) return fail("Elegí una compañía.");
      if (!form.vencimiento) return fail("Indicá el vencimiento.");
      if (esCuponera) {
        if (Number((form.primaOG || "").replace(/\D/g, "")) <= 0) return fail("Ingresá el precio (prima OG).");
      } else if (Number((form.cuota || "").replace(/\D/g, "")) <= 0) {
        return fail("Ingresá el valor de la cuota.");
      }
    }
    return true;
  }

  function next() { if (validar()) setStep((s) => Math.min(s + 1, steps.length - 1)); }
  function back() { setError(undefined); setStep((s) => Math.max(s - 1, 0)); }

  function elegirRamo(id: string, nombre: string) {
    setForm((p) => ({ ...p, ramoId: id, ramoNombre: nombre, cobertura: "" }));
  }

  async function guardar() {
    if (!validar()) return;
    const limpio = (s: string) => (s.trim() !== "" ? s.trim() : undefined);
    const companiaId = companias.find((c) => c.nombre === form.companiaNombre)?.id;
    if (!companiaId) { setError("Compañía no válida."); return; }

    // Cuponera: se define en el selector de forma de pago (no se vuelve a preguntar).
    const usarCuponera = esCuponera;
    // El plan de cuotas define directamente la cantidad: Mensual=1, Bimestral=2, Trimestral=3.
    const cantidadCuotas = PERIODO_CUOTAS[form.periodoCuotas] ?? 1;
    const primaOGNum = Number((form.primaOG || "").replace(/[^\d]/g, ""));
    // Precio real: en cuponera el único valor cargado; si no, valor de cuota × cantidad.
    const precioTotal = esCuponera
      ? primaOGNum
      : Number((form.cuota || "").replace(/[^\d]/g, "")) * cantidadCuotas;

    const domicilio = [
      [form.calle, form.numero].filter((x) => x.trim()).join(" "),
      form.piso, form.localidad, form.provincia,
    ].filter((x) => x && x.trim()).join(", ");

    const dto: AltaAsegurado = {
      clienteNombre: `${form.nombre} ${form.apellido}`.trim(),
      documento: form.idNumber.replace(/\D/g, ""),
      email: limpio(form.email),
      telefono: limpio(form.telefono),
      direccion: domicilio || undefined,
      tipoDocumento: form.idType,
      fechaNacimiento: form.nac || undefined,
      companiaId,
      ramoId: Number(form.ramoId),
      fechaInicio: isoHoy(),
      fechaFin: form.vencimiento,
      precioTotal,
      cantidadCuotas,
      formaPago: usarCuponera ? "Cuponera" : limpio(form.formaPago),
      // Cuponera: se elimina la Prima OG (se usa únicamente el valor real como precio).
      primaOG: usarCuponera ? undefined : (form.primaOG ? Number(form.primaOG.replace(/[^\d]/g, "")) : undefined),
      tipoCobertura: limpio(form.cobertura),   // cobertura = dato de la póliza (también aplica al vehículo)
      ...(tieneVehiculo ? {
        patente: limpio(form.patente),
        marca: limpio(form.marca),
        modelo: limpio(form.modelo),
        anio: form.anio ? Number(form.anio) : undefined,
        chasis: limpio(form.chasis),
        motor: limpio(form.motor),
        tipoCobertura: limpio(form.cobertura),
        combustion: form.combustion.length ? form.combustion.join(" / ") : undefined,
      } : {}),
    };
    try {
      const res = await crear.mutateAsync(dto);
      setPolNum(res.numero || "");
      setSaved(true);
      setTimeout(() => navigate(`/polizas/${res.polizaId}`), 1600);
    } catch (e: any) {
      const data = e?.response?.data;
      const detalles = data?.detalles ? Object.values(data.detalles).flat().join(" ") : "";
      setError([data?.error, detalles].filter(Boolean).join(" — ") || "No se pudo completar el alta.");
    }
  }

  return (
    <div>
      {/* HERO */}
      <div style={S.hero}>
        <div>
          <div style={S.crumb}>
            <span style={S.crumbA} onClick={() => navigate("/")}>Inicio</span>{" · "}
            <span style={S.crumbA} onClick={() => navigate("/")}>Cartera</span>{" · Nueva póliza"}
          </div>
          <h1 style={S.h1}>Nueva póliza</h1>
          <p style={S.sub}>Completá los datos del cliente y el riesgo para emitir y archivar la póliza.</p>
        </div>
        <div style={S.headBtns}>
          <button style={S.ghostBtn} onClick={() => navigate("/")}><IconClose size={15} /> Cancelar</button>
        </div>
      </div>

      <div style={{ ...S.shell, ...(mobile ? { gridTemplateColumns: "1fr" } : null) }}>
        {/* STEPPER */}
        <aside style={S.stepper}>
          <div style={S.stepperTitle}>Progreso</div>
          {steps.map((s, i) => {
            const state = i === step ? "active" : i < step ? "done" : "pending";
            return (
              <div key={s.k} style={stepStyle(state)} onClick={() => i < step && setStep(i)}>
                <div style={stepDot(state)}>{state === "done" ? <IconCheck size={13} /> : i + 1}</div>
                {i < steps.length - 1 && <div style={stepLine(state === "done")} />}
                <div style={{ paddingTop: 3 }}>
                  <div style={stepL(state === "active")}>{s.l}</div>
                  <div style={S.stepSub}>{s.s}</div>
                </div>
              </div>
            );
          })}
        </aside>

        {/* CARD */}
        <main style={S.card}>
          {stepKey === "cliente" && (
            <>
              <CardHead n="Paso 1 · Cliente" t="Datos del tomador" s="Información de identidad y domicilio de la persona o razón social asegurada." />
              <div style={S.cardBody}>
                <div style={{ marginBottom: 18 }}>
                  <div style={{ ...S.label, marginBottom: 8 }}>Tipo de documento <span style={S.required}>*</span></div>
                  <div style={{ display: "inline-flex", border: "1.5px solid var(--line)", borderRadius: 10, padding: 3, gap: 2 }}>
                    {["DNI", "CUIL", "CUIT", "Pasaporte"].map((t) => (
                      <button key={t} onClick={() => set("idType")(t)}
                        style={{ padding: "7px 16px", borderRadius: 8, border: 0, background: form.idType === t ? "var(--navy-900)" : "transparent", color: form.idType === t ? "white" : "var(--ink-700)", fontSize: 13, fontWeight: 500, cursor: "pointer" }}>{t}</button>
                    ))}
                  </div>
                </div>

                <Field label={form.idType} required hint="Sin puntos ni guiones · si ya existe, se autocompleta">
                  <InputBox focus={focus === "id"} onFocus={() => setFocus("id")} onBlur={() => setFocus(null)}>
                    <input className="mono" style={S.input} placeholder={form.idType === "CUIL" ? "20-12345678-9" : "27.345.123"} value={form.idNumber} onChange={(e) => set("idNumber")(e.target.value)} onBlur={autocompletarPorDni} />
                  </InputBox>
                </Field>
                <Sp h={16} />
                <div style={grid("1fr 1fr")}>
                  <Field label="Nombre" required>
                    <InputBox focus={focus === "n"} onFocus={() => setFocus("n")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="Nombre completo" value={form.nombre} onChange={(e) => set("nombre")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                  <Field label="Apellido">
                    <InputBox focus={focus === "a"} onFocus={() => setFocus("a")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="Apellido" value={form.apellido} onChange={(e) => set("apellido")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                </div>
                <Sp h={16} />
                <Field label="Fecha de nacimiento">
                  <InputBox focus={focus === "nac"} onFocus={() => setFocus("nac")} onBlur={() => setFocus(null)}>
                    <IconCal size={16} style={{ color: "var(--ink-400)" }} />
                    <input type="date" style={S.input} value={form.nac} onChange={(e) => set("nac")(e.target.value)} />
                  </InputBox>
                </Field>
                <Sp h={16} />
                <Field label="Domicilio" hint="Calle y altura">
                  <InputBox focus={focus === "dom"} onFocus={() => setFocus("dom")} onBlur={() => setFocus(null)}>
                    <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="Av. Corrientes" value={form.calle} onChange={(e) => set("calle")(e.target.value.toUpperCase())} />
                  </InputBox>
                </Field>
                <Sp h={12} />
                <div style={grid("1fr 1fr")}>
                  <Field label="Número">
                    <InputBox focus={focus === "num"} onFocus={() => setFocus("num")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={S.input} placeholder="3450" value={form.numero} onChange={(e) => set("numero")(e.target.value)} />
                    </InputBox>
                  </Field>
                  <Field label="Piso / Dto.">
                    <InputBox focus={focus === "piso"} onFocus={() => setFocus("piso")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="5° B" value={form.piso} onChange={(e) => set("piso")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                </div>
                <Sp h={12} />
                <div style={grid("1fr 1fr")}>
                  <Field label="Localidad">
                    <InputBox focus={focus === "loc"} onFocus={() => setFocus("loc")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="CABA" value={form.localidad} onChange={(e) => set("localidad")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                  <Field label="Provincia">
                    <SelectBox focus={focus === "prov"} onFocus={() => setFocus("prov")} onBlur={() => setFocus(null)} value={form.provincia} onChange={(v) => set("provincia")(v)} placeholder="Seleccionar" options={PROVINCIAS} />
                  </Field>
                </div>
                <Sp h={16} />
                <div style={grid("1fr 1.4fr")}>
                  <Field label="Teléfono" hint="Con código de área">
                    <InputBox focus={focus === "tel"} onFocus={() => setFocus("tel")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={S.input} placeholder="+54 11 5555-1234" value={form.telefono} onChange={(e) => set("telefono")(e.target.value)} />
                    </InputBox>
                  </Field>
                  <Field label="Correo electrónico">
                    <InputBox focus={focus === "email"} onFocus={() => setFocus("email")} onBlur={() => setFocus(null)}>
                      <IconMail size={16} style={{ color: "var(--ink-400)" }} />
                      <input type="email" style={S.input} placeholder="nombre@correo.com" value={form.email} onChange={(e) => set("email")(e.target.value)} />
                    </InputBox>
                  </Field>
                </div>
              </div>
            </>
          )}

          {stepKey === "vehiculo" && (
            <>
              <CardHead n="Paso 2 · Vehículo" t="Datos del bien asegurado" s="Identificación del vehículo asegurado." />
              <div style={S.cardBody}>
                {avisoPatente && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--warn-100)", border: "1px solid var(--warn-500)", borderRadius: 9, fontSize: 13, color: "var(--warn-700)", fontWeight: 500 }}>
                    ⚠ {avisoPatente}
                  </div>
                )}
                {patenteInfo && (
                  <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--ok-100)", border: "1px solid var(--ok-500)", borderRadius: 9, fontSize: 13, color: "var(--ok-700)", fontWeight: 500 }}>
                    ✓ {patenteInfo}
                  </div>
                )}
                <div style={grid("1fr 1fr")}>
                  <Field label="Patente" required hint="Formato AB123CD o ABC123">
                    <InputBox focus={focus === "pat"} onFocus={() => setFocus("pat")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={{ ...S.input, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }} placeholder="AB 123 CD" maxLength={9} value={form.patente} onChange={(e) => set("patente")(e.target.value.toUpperCase())} onBlur={chequearPatente} />
                    </InputBox>
                  </Field>
                  <Field label="Año">
                    <InputBox focus={focus === "anio"} onFocus={() => setFocus("anio")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={S.input} placeholder="2021" maxLength={4} value={form.anio} onChange={(e) => set("anio")(e.target.value)} />
                    </InputBox>
                  </Field>
                </div>
                <Sp h={16} />
                <div style={grid("1fr 1.5fr")}>
                  <Field label="Marca" required>
                    <InputBox focus={focus === "marca"} onFocus={() => setFocus("marca")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="Ej. Volkswagen" value={form.marca} onChange={(e) => set("marca")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                  <Field label="Modelo" required>
                    <InputBox focus={focus === "modelo"} onFocus={() => setFocus("modelo")} onBlur={() => setFocus(null)}>
                      <input style={{ ...S.input, textTransform: "uppercase" }} placeholder="Ej. Gol Trend 1.6" value={form.modelo} onChange={(e) => set("modelo")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                </div>
                <Sp h={16} />
                <div style={grid("1fr 1fr")}>
                  <Field label="N° de motor">
                    <InputBox focus={focus === "motor"} onFocus={() => setFocus("motor")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={{ ...S.input, textTransform: "uppercase" }} placeholder="CFZ-A12345" value={form.motor} onChange={(e) => set("motor")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                  <Field label="N° de chasis" hint="17 caracteres">
                    <InputBox focus={focus === "chasis"} onFocus={() => setFocus("chasis")} onBlur={() => setFocus(null)}>
                      <input className="mono" style={{ ...S.input, textTransform: "uppercase" }} placeholder="9BWZZZ377VT004251" maxLength={17} value={form.chasis} onChange={(e) => set("chasis")(e.target.value.toUpperCase())} />
                    </InputBox>
                  </Field>
                </div>
                <Sp h={16} />
                <Field label="Tipo de combustión" hint="Seleccioná hasta 2 opciones">
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {COMBUSTION_OPTS.map(({ k, color }) => {
                      const sel = form.combustion.includes(k);
                      const maxed = !sel && form.combustion.length >= 2;
                      return (
                        <button key={k} onClick={() => { if (maxed) return; set("combustion")(sel ? form.combustion.filter((c) => c !== k) : [...form.combustion, k]); }}
                          style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 10, border: "1.5px solid " + (sel ? "var(--navy-900)" : maxed ? "var(--line-2)" : "var(--line)"), background: sel ? "var(--blue-100)" : maxed ? "var(--canvas)" : "var(--paper)", color: sel ? "var(--navy-900)" : maxed ? "var(--ink-400)" : "var(--ink-700)", cursor: maxed ? "not-allowed" : "pointer", fontSize: 13.5, fontWeight: 500, opacity: maxed ? 0.55 : 1 }}>
                          {sel ? <IconCheck size={13} /> : <span style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />}
                          {k}
                        </button>
                      );
                    })}
                  </div>
                </Field>
              </div>
            </>
          )}

          {stepKey === "poliza" && (
            <>
              <CardHead n="Paso 3 · Póliza" t="Detalles de la cobertura" s="Definí compañía, ramo, tipo de cobertura, vigencia y valor de la cuota." />
              <div style={S.cardBody}>
                <Field label="Compañía aseguradora" required>
                  <SelectBox focus={focus === "co"} onFocus={() => setFocus("co")} onBlur={() => setFocus(null)} value={form.companiaNombre} onChange={(v) => set("companiaNombre")(v)} placeholder="Seleccioná una compañía"
                    options={companias.map((c) => c.nombre)}
                    renderOption={(name) => {
                      const idx = companias.findIndex((x) => x.nombre === name);
                      const col = idx >= 0 ? (companias[idx].color || coColor(idx)) : "var(--ink-400)";
                      return <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: col }} />{name}</span>;
                    }} />
                </Field>
                <Sp h={18} />
                <Field label="Tipo de póliza (ramo)" required>
                  <div style={S.segWrap}>
                    {ramos.map((r) => (
                      <button key={r.id} onClick={() => elegirRamo(String(r.id), r.nombre)} style={segItem(form.ramoId === String(r.id))}>
                        <span style={{ color: form.ramoId === String(r.id) ? "var(--navy-900)" : "var(--blue-600)" }}>{ramoIcon(r.nombre)}</span>
                        {r.nombre}
                      </button>
                    ))}
                  </div>
                </Field>
                <Sp h={18} />
                <div style={grid("1fr 1fr")}>
                  <Field label="Tipo de cobertura">
                    <SelectBox focus={focus === "cob"} onFocus={() => setFocus("cob")} onBlur={() => setFocus(null)} value={form.cobertura} onChange={(v) => set("cobertura")(v)} placeholder="Seleccionar cobertura"
                      options={coberturas.map((c) => c.nombre)} />
                  </Field>
                  <Field label="Período de póliza" required hint="Duración de la vigencia">
                    <SelectBox focus={focus === "perPol"} onFocus={() => setFocus("perPol")} onBlur={() => setFocus(null)} value={form.periodoPoliza} onChange={(v) => set("periodoPoliza")(v)} options={Object.keys(PERIODO_POLIZA)} />
                  </Field>
                </div>
                <Sp h={16} />
                <div style={grid("1fr 1fr")}>
                  <Field label="Vencimiento (vigencia)" hint="Se calcula según el plan; podés ajustarlo">
                    <InputBox focus={focus === "ven"} onFocus={() => setFocus("ven")} onBlur={() => setFocus(null)}>
                      <IconCal size={16} style={{ color: "var(--ink-400)" }} />
                      <input type="date" style={S.input} value={form.vencimiento} onChange={(e) => set("vencimiento")(e.target.value)} />
                    </InputBox>
                  </Field>
                  <Field label="Período de cuotas" required hint="Frecuencia de pago">
                    <div style={{ display: "flex", gap: 6, height: 42 }}>
                      {Object.keys(PERIODO_CUOTAS).map((p) => (
                        <button key={p} onClick={() => set("periodoCuotas")(p)}
                          style={{ flex: 1, borderRadius: 9, border: "1.5px solid " + (form.periodoCuotas === p ? "var(--navy-900)" : "var(--line)"), background: form.periodoCuotas === p ? "var(--blue-100)" : "var(--paper)", color: form.periodoCuotas === p ? "var(--navy-900)" : "var(--ink-700)", fontSize: 13, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                          {form.periodoCuotas === p && <IconCheck size={13} />}{p}
                        </button>
                      ))}
                    </div>
                  </Field>
                </div>
                <Sp h={16} />
                <div style={grid(esCuponera ? "1fr" : "1fr 1fr")}>
                  {!esCuponera && (
                    <Field label={"Valor de la cuota " + form.periodoCuotas.toLowerCase()} required hint="En pesos argentinos">
                      <InputBox focus={focus === "cuota"} onFocus={() => setFocus("cuota")} onBlur={() => setFocus(null)}>
                        <span style={S.inputAdorn}>ARS $</span>
                        <input className="mono" style={S.input} placeholder="38.500" value={form.cuota} onChange={(e) => set("cuota")(e.target.value)} />
                        <span style={S.inputAdorn}>/ {({ Mensual: "mes", Bimestral: "bimestre", Trimestral: "trimestre" } as Record<string, string>)[form.periodoCuotas] || "mes"}</span>
                      </InputBox>
                    </Field>
                  )}
                  <Field label="Forma de pago" hint={esCuponera ? "Cuponera: se registra el pago sin comprobante" : undefined}>
                    <SelectBox focus={focus === "pago"} onFocus={() => setFocus("pago")} onBlur={() => setFocus(null)} value={form.formaPago} onChange={(v) => set("formaPago")(v)} options={["Débito automático", "Tarjeta de crédito", "CBU", "Efectivo", "Cuponera"]} />
                  </Field>
                </div>
                <Sp h={16} />
                <Field label={esCuponera ? "Precio (Prima OG)" : "Prima OG (interna)"} required={esCuponera}
                  hint={esCuponera ? "Único precio de la cuponera" : "Prima real de la compañía — no figura en el comprobante del cliente"}>
                  <InputBox focus={focus === "primaog"} onFocus={() => setFocus("primaog")} onBlur={() => setFocus(null)}>
                    <span style={S.inputAdorn}>ARS $</span>
                    <input className="mono" style={S.input} placeholder="0" value={form.primaOG} onChange={(e) => set("primaOG")(e.target.value)} />
                  </InputBox>
                </Field>
              </div>
            </>
          )}

          {error && <div style={{ margin: "0 26px", padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{error}</div>}

          <div style={S.cardFoot}>
            <div style={S.footHint}>Paso {step + 1} de {steps.length} · Los campos con <span style={{ color: "var(--bad-700)" }}>*</span> son obligatorios</div>
            <div style={{ display: "flex", gap: 10 }}>
              {step > 0 && <button style={S.ghostBtn} onClick={back}><IconChevL size={15} /> Atrás</button>}
              {!esUltimo ? (
                <button style={S.primaryBtn} onClick={next}>Siguiente <IconChevR size={15} /></button>
              ) : (
                <button style={S.greenBtn} onClick={guardar} disabled={crear.isPending}>
                  <IconCheck size={16} /> {crear.isPending ? "Guardando…" : "Guardar y archivar"}
                </button>
              )}
            </div>
          </div>
        </main>

        {/* SUMMARY */}
        <SummaryPanel form={form} />
      </div>

      {saved && (
        <div style={S.modalBack}>
          <div style={S.modal}>
            <div style={S.modalIcon}><IconCheck size={28} sw={2.5} /></div>
            <h3 style={{ margin: "0 0 6px", fontSize: 20, letterSpacing: "-0.02em" }}>Póliza guardada y archivada</h3>
            <p style={{ margin: 0, color: "var(--ink-500)", fontSize: 14 }}>
              {polNum && <>Se generó la póliza <span className="mono" style={{ color: "var(--ink-900)", fontWeight: 600 }}>{polNum}</span>.<br /></>}
              La cartera se está actualizando…
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── átomos ── */
function CardHead({ n, t, s }: { n: string; t: string; s: string }) {
  return (
    <div style={S.cardHead}>
      <div style={S.cardKicker}>{n}</div>
      <h2 style={S.cardTitle}>{t}</h2>
      <p style={S.cardSub}>{s}</p>
    </div>
  );
}
function Sp({ h }: { h: number }) { return <div style={{ height: h }} />; }
function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) {
  return (
    <div style={S.field}>
      <div style={S.label}>
        <span>{label}{required && <span style={S.required}>*</span>}</span>
        {hint && <span style={S.hint}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function InputBox({ focus, onFocus, onBlur, children }: { focus: boolean; onFocus: () => void; onBlur: () => void; children: ReactNode }) {
  return <div style={inputWrap(focus)} onFocus={onFocus} onBlur={onBlur}>{children}</div>;
}
function SelectBox({ focus, onFocus, onBlur, value, onChange, placeholder, options, renderOption }: {
  focus: boolean; onFocus: () => void; onBlur: () => void; value: string; onChange: (v: string) => void;
  placeholder?: string; options: string[]; renderOption?: (o: string) => ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // El menú se renderiza en un portal (position:fixed) para que no lo recorte la card.
  useLayoutEffect(() => {
    if (!open || !triggerRef.current) return;
    const r = triggerRef.current.getBoundingClientRect();
    setPos({ top: r.bottom + 6, left: r.left, width: r.width });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      setOpen(false);
    };
    const close = () => setOpen(false);
    // Al scrollear dentro del propio menú no se cierra; sí al scrollear la página.
    const onScroll = (e: Event) => { if (menuRef.current?.contains(e.target as Node)) return; setOpen(false); };
    window.addEventListener("mousedown", h);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("mousedown", h);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open]);

  return (
    <div style={{ position: "relative" }}>
      <div ref={triggerRef} style={inputWrap(focus || open)} onClick={() => setOpen((o) => !o)} onFocus={onFocus} onBlur={onBlur} tabIndex={0}>
        <div style={{ flex: 1, fontSize: 14, color: value ? "var(--ink-900)" : "var(--ink-400)" }}>
          {value ? (renderOption ? renderOption(value) : value) : (placeholder || "Seleccionar")}
        </div>
        <IconChevD size={15} style={{ color: "var(--ink-400)", transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </div>
      {open && createPortal(
        <div ref={menuRef} style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, boxShadow: "var(--shadow-lg)", padding: 4, zIndex: 1000, maxHeight: 280, overflowY: "auto" }}>
          {options.length === 0 && <div style={{ padding: "9px 12px", fontSize: 13, color: "var(--ink-400)" }}>Sin opciones</div>}
          {options.map((o) => (
            <div key={o} onClick={() => { onChange(o); setOpen(false); }}
              style={{ padding: "9px 12px", borderRadius: 7, cursor: "pointer", fontSize: 14, color: "var(--ink-900)", display: "flex", alignItems: "center", justifyContent: "space-between", background: value === o ? "var(--blue-100)" : "transparent" }}
              onMouseEnter={(e) => { if (value !== o) e.currentTarget.style.background = "var(--blue-50)"; }}
              onMouseLeave={(e) => { if (value !== o) e.currentTarget.style.background = "transparent"; }}>
              <span>{renderOption ? renderOption(o) : o}</span>
              {value === o && <IconCheck size={14} style={{ color: "var(--blue-600)" }} />}
            </div>
          ))}
        </div>,
        document.body,
      )}
    </div>
  );
}

function SummaryPanel({ form }: { form: Form }) {
  const fullName = [form.nombre, form.apellido].filter(Boolean).join(" ") || null;
  const dom = [form.calle, form.numero].filter(Boolean).join(" ");
  const vehicle = [form.marca, form.modelo].filter(Boolean).join(" ");
  const cuotaFmt = form.cuota ? "$ " + form.cuota : "—";
  return (
    <aside style={S.summary}>
      <div style={S.summaryHead}>
        <div style={S.summaryTitle}>Resumen</div>
        <div style={S.summaryAmt} className="mono">{cuotaFmt}</div>
        <div style={S.summaryAmtSub}>{form.ramoNombre || "—"}{form.cobertura ? " · " + form.cobertura : ""}</div>
      </div>
      <div style={S.summaryBody}>
        <Row k="Tomador" v={fullName} />
        <Row k={form.idType} v={form.idNumber || null} mono />
        <Row k="Teléfono" v={form.telefono || null} mono />
        <Row k="Email" v={form.email || null} />
        <Row k="Domicilio" v={dom || null} />
        <Row k="Patente" v={form.patente || null} mono />
        <Row k="Vehículo" v={vehicle || null} />
        <Row k="Año" v={form.anio || null} mono />
        <Row k="Combustión" v={form.combustion.length ? form.combustion.join(" / ") : null} />
        <Row k="Compañía" v={form.companiaNombre || null} />
        <Row k="Vigencia" v={`${PERIODO_CUOTAS[form.periodoCuotas] ?? 1} mes(es)`} />
        <Row k="Cuotas" v={form.periodoCuotas || null} />
        <Row k="Vencimiento" v={form.vencimiento || null} mono last />
      </div>
    </aside>
  );
}
function Row({ k, v, mono, last }: { k: string; v: string | null; mono?: boolean; last?: boolean }) {
  return (
    <div style={{ ...S.summaryRow, ...(last ? { borderBottom: 0 } : {}) }}>
      <span style={S.summaryK}>{k}</span>
      <span style={{ ...S.summaryV, ...(mono ? { fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5 } : {}) }}>
        {v || <span style={S.summaryEmpty}>—</span>}
      </span>
    </div>
  );
}

/* ── estilos (portados de npStyles) ── */
// Multi-columna se reacomoda en pantallas angostas (se apila); una sola columna queda igual.
const grid = (cols: string): CSSProperties => ({
  display: "grid",
  gridTemplateColumns: cols.trim().includes(" ") ? "repeat(auto-fit, minmax(200px, 1fr))" : cols,
  gap: 16,
});
const inputWrap = (focused: boolean): CSSProperties => ({ display: "flex", alignItems: "center", gap: 10, padding: "0 12px", height: 42, background: "var(--paper)", borderRadius: 9, border: "1.5px solid " + (focused ? "var(--blue-500)" : "var(--line)"), boxShadow: focused ? "0 0 0 4px oklch(0.62 0.16 243 / 0.10)" : "none", transition: "all .15s" });
const segItem = (active: boolean): CSSProperties => ({ display: "flex", alignItems: "center", gap: 9, padding: "12px 14px", borderRadius: 10, border: "1.5px solid " + (active ? "var(--navy-900)" : "var(--line)"), background: active ? "var(--blue-100)" : "var(--paper)", color: active ? "var(--navy-900)" : "var(--ink-700)", cursor: "pointer", fontSize: 13.5, fontWeight: 500, transition: "all .12s" });
const stepStyle = (state: string): CSSProperties => ({ display: "flex", gap: 14, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: state === "active" ? "var(--paper)" : "transparent", border: state === "active" ? "1px solid var(--line)" : "1px solid transparent", boxShadow: state === "active" ? "var(--shadow-sm)" : "none", cursor: state === "done" ? "pointer" : "default", position: "relative" });
const stepDot = (state: string): CSSProperties => ({ width: 26, height: 26, borderRadius: "50%", flexShrink: 0, display: "grid", placeItems: "center", background: state === "done" ? "var(--ok-500)" : state === "active" ? "var(--navy-900)" : "var(--paper)", color: state === "pending" ? "var(--ink-500)" : "white", border: state === "pending" ? "1.5px solid var(--line)" : "0", fontSize: 12, fontWeight: 600 });
const stepLine = (done: boolean): CSSProperties => ({ position: "absolute", left: 27, top: 38, bottom: -12, width: 1.5, background: done ? "var(--ok-500)" : "var(--line)" });
const stepL = (active: boolean): CSSProperties => ({ fontSize: 14, fontWeight: 600, color: active ? "var(--ink-900)" : "var(--ink-700)", lineHeight: 1.2 });

const S: Record<string, CSSProperties> = {
  hero: { padding: "32px 0 12px", display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24 },
  crumb: { fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 },
  crumbA: { color: "var(--ink-500)", textDecoration: "none", cursor: "pointer" },
  h1: { margin: 0, fontSize: 28, letterSpacing: "-0.025em", fontWeight: 600, color: "var(--ink-900)" },
  sub: { margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14 },
  headBtns: { display: "flex", gap: 10 },
  ghostBtn: { height: 38, padding: "0 14px", borderRadius: 9, background: "transparent", border: "1px solid var(--line)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 7 },
  shell: { margin: "16px 0 60px", display: "grid", gridTemplateColumns: "240px minmax(0, 1fr) 320px", gap: 24, alignItems: "start" },
  stepper: { position: "sticky", top: 88, display: "flex", flexDirection: "column", gap: 4 },
  stepperTitle: { fontSize: 11, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 },
  stepSub: { fontSize: 12.5, color: "var(--ink-500)", marginTop: 3 },
  card: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" },
  cardHead: { padding: "20px 26px 18px", borderBottom: "1px solid var(--line-2)" },
  cardKicker: { fontSize: 11.5, fontWeight: 600, color: "var(--blue-600)", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: 6 },
  cardTitle: { margin: 0, fontSize: 20, letterSpacing: "-0.02em", fontWeight: 600, color: "var(--ink-900)" },
  cardSub: { margin: "4px 0 0", color: "var(--ink-500)", fontSize: 13.5 },
  cardBody: { padding: "22px 26px 26px" },
  field: { display: "flex", flexDirection: "column", gap: 7 },
  label: { fontSize: 12.5, fontWeight: 500, color: "var(--ink-700)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  required: { color: "var(--bad-700)", marginLeft: 3 },
  hint: { fontSize: 11.5, color: "var(--ink-400)", fontWeight: 400 },
  input: { flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 14, color: "var(--ink-900)", height: "100%" },
  inputAdorn: { fontSize: 12, color: "var(--ink-400)", fontWeight: 500 },
  segWrap: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 8 },
  cardFoot: { padding: "16px 26px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)", display: "flex", alignItems: "center", justifyContent: "space-between" },
  footHint: { fontSize: 12.5, color: "var(--ink-500)" },
  primaryBtn: { height: 44, padding: "0 20px", borderRadius: 10, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", display: "inline-flex", alignItems: "center", gap: 9 },
  greenBtn: { height: 44, padding: "0 22px", borderRadius: 10, background: "linear-gradient(180deg, var(--blue-600), var(--navy-800))", color: "white", border: 0, cursor: "pointer", fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em", display: "inline-flex", alignItems: "center", gap: 9, boxShadow: "0 8px 24px -8px oklch(0.30 0.10 250 / 0.5)" },
  summary: { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden", position: "sticky", top: 88 },
  summaryHead: { padding: "16px 18px", background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))", color: "white" },
  summaryTitle: { fontSize: 12, fontWeight: 600, letterSpacing: "0.10em", textTransform: "uppercase", opacity: 0.8 },
  summaryAmt: { fontSize: 28, fontWeight: 600, letterSpacing: "-0.02em", marginTop: 4 },
  summaryAmtSub: { fontSize: 12, color: "oklch(0.85 0.04 240)", marginTop: 2 },
  summaryBody: { padding: "14px 18px" },
  summaryRow: { display: "flex", justifyContent: "space-between", gap: 12, padding: "10px 0", borderBottom: "1px dashed var(--line)", fontSize: 13 },
  summaryK: { color: "var(--ink-500)" },
  summaryV: { color: "var(--ink-900)", fontWeight: 500, textAlign: "right", maxWidth: "60%", overflowWrap: "anywhere" },
  summaryEmpty: { color: "var(--ink-400)", fontStyle: "italic" },
  modalBack: { position: "fixed", inset: 0, background: "oklch(0.18 0.06 252 / 0.45)", backdropFilter: "blur(4px)", zIndex: 50, display: "grid", placeItems: "center" },
  modal: { width: 440, background: "var(--paper)", borderRadius: 16, padding: 28, textAlign: "center", boxShadow: "var(--shadow-lg)" },
  modalIcon: { width: 64, height: 64, borderRadius: "50%", background: "var(--ok-100)", color: "var(--ok-700)", margin: "0 auto 16px", display: "grid", placeItems: "center" },
};
