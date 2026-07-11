import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { usePolizas, useCompanias, useCobrosPorPoliza, useRenovarPoliza } from "../hooks/polizas";
import { useCobrosPendientes } from "../hooks/cobranzas";
import { useIsMobile } from "../hooks/useMediaQuery";
import { useAuth } from "../auth/AuthContext";
import { anularPago } from "../api/anulaciones";
import type { RenovarPolizaDto } from "../api/polizas";
import PagoModal from "../components/cobranzas/PagoModal";
import ComprobanteModal, { type ComprobanteData } from "../components/cobranzas/ComprobanteModal";
import RenovarForm from "../components/cobranzas/RenovarForm";
import Modal from "../components/ui/Modal";
import { Cargando, VacioState } from "../components/ui/States";
import { IconSearch } from "../components/Icons";
import { formatFecha, formatMoneda } from "../utils/format";
import { companiaColor } from "../utils/companiaColor";
import type { Cobro, Poliza } from "../types";

function iniciales(n: string) {
  return n.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function CuotaDots({ total, pagadas, vencidas }: { total: number; pagadas: number; vencidas: number }) {
  if (!total) return null;
  const dots = Array.from({ length: total }, (_, i) => {
    const color = i < pagadas ? "var(--ok-500)" : i < pagadas + vencidas ? "var(--bad-500)" : "oklch(0.88 0.02 245)";
    return <span key={i} style={{ width: 16, height: 5, borderRadius: 999, background: color }} />;
  });
  return (
    <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "inline-flex", gap: 3, flexWrap: "wrap", maxWidth: 220 }}>{dots}</div>
      <span style={{ fontSize: 11.5, color: "var(--ink-500)", whiteSpace: "nowrap" }}>{pagadas}/{total} pagas</span>
    </div>
  );
}

export default function Cobranzas() {
  const mobile = useIsMobile();
  const hoy = new Date();
  const polizas = usePolizas(0, 1, 10000);          // pólizas activas (master, todas)
  const companias = useCompanias();
  const pendMes = useCobrosPendientes(hoy.getMonth() + 1, hoy.getFullYear());

  const [params] = useSearchParams();
  const polizaParam = params.get("poliza");
  const [search, setSearch] = useState("");
  const [focus, setFocus] = useState(false);
  const [chip, setChip] = useState<"todos" | "morosos" | "pendientes" | "aldia">("todos");
  // Se inicializa ya con la póliza del parámetro (evita que el efecto de "primera de la lista"
  // la pise cuando la lista viene cacheada).
  const [selId, setSelId] = useState<number | null>(polizaParam ? Number(polizaParam) : null);

  // Preselección al venir desde Cartera ("Cobrar cuota" → /cobranzas?poliza=ID)
  useEffect(() => {
    if (polizaParam) setSelId(Number(polizaParam));
  }, [polizaParam]);

  const lista = polizas.data?.items ?? [];
  // Sets derivados de los cobros del mes (polizaId + estado) para los filtros.
  const vencidaSet = useMemo(() => new Set((pendMes.data ?? []).filter((c) => c.estado === 2).map((c) => c.polizaId)), [pendMes.data]);
  const pendienteSet = useMemo(() => new Set((pendMes.data ?? []).filter((c) => c.estado === 0).map((c) => c.polizaId)), [pendMes.data]);
  const filtradas = useMemo(() => {
    const q = search.trim().toLowerCase();
    return lista.filter((p) => {
      if (chip === "morosos" && !vencidaSet.has(p.id)) return false;
      if (chip === "pendientes" && !pendienteSet.has(p.id)) return false;
      if (chip === "aldia" && (vencidaSet.has(p.id) || pendienteSet.has(p.id))) return false;
      if (q) {
        return (p.clienteNombre ?? "").toLowerCase().includes(q)
          || p.numero.toLowerCase().includes(q)
          || (p.patente ?? "").toLowerCase().includes(q);
      }
      return true;
    });
  }, [lista, search, chip, vencidaSet, pendienteSet]);

  useEffect(() => {
    if (selId == null && !polizaParam && filtradas.length > 0) setSelId(filtradas[0].id);
  }, [filtradas, selId, polizaParam]);

  const seleccionada = lista.find((p) => p.id === selId) ?? null;
  const mapCia = new Map((companias.data ?? []).map((c) => [c.id, c.nombre]));

  const vencidas = vencidaSet.size;
  const porCobrar = pendienteSet.size;

  return (
    <div>
      {/* Hero + KPIs */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, padding: "32px 0 12px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginBottom: 8 }}>Inicio · Cobranzas</div>
          <h1 style={{ margin: 0, fontSize: 30, letterSpacing: "-0.025em", fontWeight: 600 }}>Cobranzas</h1>
          <p style={{ margin: "6px 0 0", color: "var(--ink-500)", fontSize: 14.5 }}>Buscá al asegurado para registrar el cobro de cuotas y renovar pólizas.</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Kpi tone="red" n={vencidas} label="Cuotas vencidas" />
          <Kpi tone="amber" n={porCobrar} label="Por cobrar" />
          <Kpi tone="green" n={lista.length} label="Pólizas activas" />
        </div>
      </div>

      {/* Buscador grande + chips */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", padding: "16px 0 8px" }}>
        <div style={{ ...searchBig(focus), flex: 1 }}>
          <IconSearch size={20} style={{ color: focus ? "var(--blue-600)" : "var(--ink-400)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)}
            placeholder="Buscar asegurado por nombre, póliza o patente…" style={{ flex: 1, border: 0, outline: 0, background: "transparent", fontSize: 16 }} />
          <span style={{ fontSize: 12.5, color: "var(--ink-400)" }}>{filtradas.length} resultado{filtradas.length === 1 ? "" : "s"}</span>
        </div>
        {([["todos", "Todos"], ["morosos", "Con deuda"], ["pendientes", "Por cobrar"], ["aldia", "Al día"]] as const).map(([k, l]) => (
          <button key={k} style={chipStyle(chip === k)} onClick={() => setChip(k)}>{l}</button>
        ))}
      </div>

      {/* Master-detail */}
      <div style={{ ...shell, ...(mobile ? { gridTemplateColumns: "1fr" } : null) }}>
        {/* Lista */}
        <div style={listCard}>
          <div style={listHead}>
            <span style={{ fontWeight: 600, color: "var(--ink-900)", fontSize: 14 }}>Pólizas activas</span>
            <span>{filtradas.length}</span>
          </div>
          {polizas.isLoading ? <Cargando /> : filtradas.length === 0 ? <VacioState mensaje="Sin resultados." /> : (
            <div style={{ maxHeight: 560, overflowY: "auto" }}>
              {filtradas.slice(0, 60).map((p) => (
                <div key={p.id} onClick={() => setSelId(p.id)} style={row(p.id === selId)}>
                  <div style={ava(companiaColor(p.companiaId))}>{iniciales(p.clienteNombre ?? "?")}</div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.clienteNombre ?? "—"}</div>
                    <div style={{ fontSize: 12.5, color: "var(--ink-500)", marginTop: 2 }}>
                      <span className="mono">{p.numero}</span> · {p.ramoNombre ?? "—"}
                    </div>
                    <CuotaDots total={p.cuotasTotal ?? 0} pagadas={p.cuotasPagadas ?? 0} vencidas={p.cuotasVencidas ?? 0} />
                  </div>
                  <div className="mono" style={{ fontSize: 13, color: "var(--ink-700)" }}>{formatMoneda(p.precioTotal)}</div>
                </div>
              ))}
              {filtradas.length > 60 && (
                <div style={{ padding: "12px 16px", fontSize: 12.5, color: "var(--ink-500)", textAlign: "center", borderTop: "1px solid var(--line-2)" }}>
                  Mostrando 60 de {filtradas.length} — refiná con el buscador para encontrar la póliza.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detalle */}
        {seleccionada ? (
          <DetallePoliza key={seleccionada.id} poliza={seleccionada} compania={mapCia.get(seleccionada.companiaId)} companias={companias.data ?? []}
            autoCobrar={!!params.get("poliza") && seleccionada.id === Number(params.get("poliza"))} />
        ) : (
          <div style={{ ...panel, padding: 40, textAlign: "center", color: "var(--ink-400)" }}>Elegí una póliza de la lista.</div>
        )}
      </div>
    </div>
  );
}

function DetallePoliza({ poliza, compania, companias, autoCobrar }: { poliza: Poliza; compania?: string; companias: { id: number; nombre: string }[]; autoCobrar?: boolean }) {
  const { esAdmin } = useAuth();
  const qc = useQueryClient();
  const cobros = useCobrosPorPoliza(poliza.id);
  const autoHecho = useRef(false);
  const renovar = useRenovarPoliza(poliza.id);
  const [cuotaPago, setCuotaPago] = useState<Cobro | null>(null);
  const [comprobante, setComprobante] = useState<ComprobanteData | null>(null);
  const [anular, setAnular] = useState<Cobro | null>(null);
  const [anulando, setAnulando] = useState(false);
  const [toast, setToast] = useState<string>("");
  const [renovarOpen, setRenovarOpen] = useState(false);
  const [accionError, setAccionError] = useState<string>();

  function hoyAR() { return new Date().toLocaleDateString("es-AR"); }

  async function confirmarAnular() {
    if (!anular) return;
    setAnulando(true); setAccionError(undefined);
    try {
      const r = await anularPago(anular.id);
      setToast(r.mensaje);
      setAnular(null);
      await cobros.refetch();
      qc.invalidateQueries({ queryKey: ["cobros"] });
      setTimeout(() => setToast(""), 4000);
    } catch (e: any) {
      setAccionError(e?.response?.data?.error ?? "No se pudo anular el pago.");
      setAnular(null);
    } finally { setAnulando(false); }
  }

  const cuotas = cobros.data ?? [];
  const pagadas = cuotas.filter((c) => c.estado === 1).length;
  const todasPagas = cuotas.length > 0 && pagadas === cuotas.length;
  // La vigencia visible se actualiza al vencimiento de la última cuota cobrada (cubierto hasta ahí).
  const pagadasOrden = [...cuotas].filter((c) => c.estado === 1).sort((a, b) => a.numeroCuota - b.numeroCuota);
  const vigenciaHasta = pagadasOrden.length ? pagadasOrden[pagadasOrden.length - 1].fechaVencimiento : poliza.fechaInicio;
  // Sólo se puede cobrar la primera cuota impaga (en orden): si hay una vencida/anterior, bloquea las siguientes.
  const primeraImpaga = [...cuotas].filter((c) => c.estado !== 1).sort((a, b) => a.numeroCuota - b.numeroCuota)[0];
  const primeraImpagaId = primeraImpaga?.id;

  // Cobro directo desde Cartera: abre el pago de la primera cuota impaga una sola vez.
  useEffect(() => {
    if (autoCobrar && !autoHecho.current && primeraImpaga) {
      autoHecho.current = true;
      setCuotaPago(primeraImpaga);
    }
  }, [autoCobrar, primeraImpaga]);

  async function confirmarRenovar(dto: RenovarPolizaDto) {
    setAccionError(undefined);
    try { await renovar.mutateAsync(dto); setRenovarOpen(false); }
    catch (e: any) { setAccionError(e?.response?.data?.error ?? "No se pudo renovar."); }
  }

  const totalCuotas = cuotas.reduce((a, c) => a + c.monto, 0);
  const status = cuotas.length === 0 ? null
    : todasPagas ? { k: "aldia", l: "Al día" }
    : cuotas.some((c) => c.estado === 2) ? { k: "morosa", l: "Con deuda" }
    : { k: "encurso", l: "En curso" };
  const faltan = cuotas.filter((c) => c.estado !== 1).length;

  return (
    <div style={panel}>
      <div style={pHead}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={pAva}>{iniciales(poliza.clienteNombre ?? "?")}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em" }}>{poliza.clienteNombre ?? "—"}</div>
            <div className="mono" style={{ fontSize: 12.5, color: "oklch(0.85 0.04 240)", marginTop: 3 }}>{poliza.numero}</div>
          </div>
          {status && (
            <span style={pStat(status.k)}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: { aldia: "var(--ok-500)", encurso: "var(--blue-500)", morosa: "var(--bad-500)" }[status.k] }} />
              {status.l}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
          {compania && <span style={pBadge}><span style={{ width: 8, height: 8, borderRadius: 2, background: companiaColor(poliza.companiaId) }} />{compania}</span>}
          {poliza.ramoNombre && <span style={pBadge}>{poliza.ramoNombre}</span>}
          {poliza.patente && <span style={pBadge} className="mono">{poliza.patente}</span>}
          {(poliza.marca || poliza.modelo) && <span style={pBadge}>{[poliza.marca, poliza.modelo].filter(Boolean).join(" ")}</span>}
          {poliza.formaPago === "Cuponera" && <span style={{ ...pBadge, background: "oklch(0.55 0.14 60 / 0.25)", border: "1px solid oklch(1 0 0 / 0.18)" }}>Cuponera · sin comprobante</span>}
        </div>
      </div>

      <div style={{ padding: "18px 22px 8px" }}>
        {accionError && <div style={{ marginBottom: 12, padding: "10px 14px", background: "var(--bad-100)", border: "1px solid var(--bad-200)", borderRadius: 9, fontSize: 13, color: "var(--bad-700)" }}>{accionError}</div>}

        <div style={infoGrid}>
          <div><div style={iL}>Ramo</div><div style={iV}>{poliza.ramoNombre ?? "—"}</div></div>
          <div><div style={iL}>Compañía</div><div style={iV}>{compania ?? "—"}</div></div>
          <div><div style={iL}>Patente</div><div style={iV} className="mono">{poliza.patente ?? "—"}</div></div>
          <div><div style={iL}>Vehículo</div><div style={iV}>{[poliza.marca, poliza.modelo].filter(Boolean).join(" ") || "—"}</div></div>
          <div><div style={iL}>Vigencia</div><div style={iV} className="mono">{formatFecha(poliza.fechaInicio)} – {formatFecha(vigenciaHasta)}</div></div>
          <div><div style={iL}>Cliente de</div><div style={iV}>{poliza.clienteVendedorNombre ?? "—"}</div></div>
        </div>

        <div style={sectionTitle}>
          <span>Detalle de cuotas</span>
          <span className="mono" style={{ color: "var(--ink-700)", fontSize: 12 }}>Total: {formatMoneda(totalCuotas)}</span>
        </div>

        {cobros.isLoading ? <Cargando /> : cuotas.length === 0 ? <VacioState mensaje="Sin cuotas." /> : (
          cuotas.map((c) => (
            <div key={c.id} style={cuotaItem(c.estado)}>
              <div style={cuotaNBox}>{String(c.numeroCuota).padStart(2, "0")}</div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--ink-900)" }}>Cuota {c.numeroCuota} de {cuotas.length}</div>
                <div style={{ fontSize: 12, color: "var(--ink-500)", marginTop: 2 }}>
                  Vence <span className="mono">{formatFecha(c.fechaVencimiento)}</span>
                  {c.estado === 1 && c.fechaPago && <> · Pagada el <span className="mono">{formatFecha(c.fechaPago)}</span></>}
                  {esAdmin && c.estado === 1 && c.cobradorNombre && <> · cobró <strong>{c.cobradorNombre}</strong></>}
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: "var(--ink-900)" }}>{formatMoneda(c.monto)}</div>
                <div style={{ marginTop: 4 }}><span style={pillEstado(c.estado)}>{c.estado === 1 ? "Pagada" : c.estado === 2 ? "Vencida" : "A pagar"}</span></div>
              </div>
              <div>
                {c.estado !== 1 ? (
                  c.id === primeraImpagaId
                    ? <button style={payBtn} onClick={() => setCuotaPago(c)}>Cobrar</button>
                    : <span title="Cobrá primero la cuota anterior/vencida" style={{ fontSize: 11, color: "var(--ink-400)", fontStyle: "italic" }}>Bloqueada</span>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ color: "var(--ok-700)", display: "grid", placeItems: "center" }}>✓</span>
                    {poliza.formaPago !== "Cuponera" && (
                      <button onClick={() => setComprobante({
                        cobroId: c.id,
                        cuotaN: c.numeroCuota,
                        monto: c.monto,
                        fecha: c.fechaPago ? formatFecha(c.fechaPago) : hoyAR(),
                        cliente: poliza.clienteNombre ?? "—",
                        poliza: poliza.numero,
                        compania: compania ?? "—",
                        ramo: poliza.ramoNombre ?? "—",
                      })} title="Reimprimir comprobante"
                        style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                        Reimprimir
                      </button>
                    )}
                    <button onClick={() => setAnular(c)} title="Anular pago"
                      style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1px solid oklch(0.85 0.08 28)", background: "var(--bad-100)", color: "var(--bad-700)", fontSize: 11.5, fontWeight: 600, cursor: "pointer" }}>
                      Anular
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={pFoot}>
        <button style={renewBtn(todasPagas)} disabled={!todasPagas} onClick={() => { setAccionError(undefined); setRenovarOpen(true); }}>
          {todasPagas ? "Renovar póliza" : `Faltan ${faltan} cuota${faltan === 1 ? "" : "s"} para renovar`}
        </button>
        <div style={{ fontSize: 12, color: "var(--ink-500)", textAlign: "center", marginTop: 8 }}>
          {todasPagas ? "Todas las cuotas están pagas. Podés iniciar el período siguiente." : "La renovación se habilita cuando se cobran todas las cuotas del período."}
        </div>
      </div>

      {cuotaPago && (
        <PagoModal
          cuota={cuotaPago}
          tituloContexto={poliza.numero}
          onClose={() => setCuotaPago(null)}
          onPagado={() => {
            // Cuponera: sólo se marca el pago, sin comprobante.
            if (poliza.formaPago === "Cuponera") {
              setToast("Pago registrado (cuponera, sin comprobante).");
              setTimeout(() => setToast(""), 4000);
              cobros.refetch();
              qc.invalidateQueries({ queryKey: ["cobros"] });
            } else {
              setComprobante({
                cobroId: cuotaPago.id,
                cuotaN: cuotaPago.numeroCuota,
                monto: cuotaPago.monto,
                fecha: hoyAR(),
                cliente: poliza.clienteNombre ?? "—",
                poliza: poliza.numero,
                compania: compania ?? "—",
                ramo: poliza.ramoNombre ?? "—",
              });
            }
            setCuotaPago(null);
          }}
        />
      )}
      {comprobante && <ComprobanteModal c={comprobante} onClose={() => setComprobante(null)} />}

      {anular && (
        <Modal titulo={`Anular cuota ${anular.numeroCuota}`} onClose={() => setAnular(null)} ancho={440}>
          <div style={{ padding: "10px 14px", background: "oklch(0.985 0.008 245)", border: "1px solid var(--line)", borderRadius: 10, marginBottom: 14, fontSize: 13 }}>
            <span style={{ color: "var(--ink-500)" }}>Importe a anular: </span>
            <strong className="mono">{formatMoneda(anular.monto)}</strong>
          </div>
          <div style={{ padding: "12px 14px", borderRadius: 10, fontSize: 13, marginBottom: 16, ...(esAdmin
            ? { background: "var(--bad-100)", border: "1px solid oklch(0.88 0.08 28)", color: "var(--bad-700)" }
            : { background: "oklch(0.97 0.04 80)", border: "1px solid oklch(0.88 0.08 80)", color: "oklch(0.42 0.10 70)" }) }}>
            {esAdmin
              ? "La cuota volverá a estado pendiente y se anulará el comprobante. La acción queda registrada."
              : "Como productor, esta anulación requiere aprobación del administrador. Se enviará la solicitud y quedará pendiente."}
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <button onClick={() => setAnular(null)} style={{ height: 38, padding: "0 16px", borderRadius: 9, border: "1px solid var(--line)", background: "var(--paper)", color: "var(--ink-700)", fontSize: 13.5, fontWeight: 500, cursor: "pointer" }}>Cancelar</button>
            <button onClick={confirmarAnular} disabled={anulando} style={{ height: 38, padding: "0 18px", borderRadius: 9, border: 0, background: "var(--bad-600)", color: "white", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              {anulando ? "Procesando…" : esAdmin ? "Anular cuota" : "Solicitar anulación"}
            </button>
          </div>
        </Modal>
      )}

      {toast && (
        <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", zIndex: 70, background: "var(--navy-900)", color: "white", padding: "13px 20px", borderRadius: 12, boxShadow: "var(--shadow-lg)", fontSize: 13.5, fontWeight: 500, maxWidth: 460 }}>
          {toast}
        </div>
      )}
      {renovarOpen && (
        <Modal titulo="Renovar póliza" onClose={() => setRenovarOpen(false)} ancho={520}>
          <RenovarForm poliza={poliza} companias={companias as any} onSubmit={confirmarRenovar} enviando={renovar.isPending} />
        </Modal>
      )}
    </div>
  );
}

function Kpi({ tone, n, label }: { tone: "amber" | "green" | "red"; n: number; label: string }) {
  const pal = { red: ["var(--bad-100)", "var(--bad-700)", "var(--bad-500)"], amber: ["var(--warn-100)", "var(--warn-700)", "var(--warn-500)"], green: ["var(--ok-100)", "var(--ok-700)", "var(--ok-500)"] }[tone];
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: pal[0], color: pal[1], padding: "10px 14px", borderRadius: 10, fontSize: 13.5, fontWeight: 500 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: pal[2] }} />
      <span className="mono" style={{ fontWeight: 600, fontSize: 15 }}>{n}</span> {label}
    </div>
  );
}

const shell: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1.05fr) minmax(0, 1fr)", gap: 20, alignItems: "start", marginTop: 16 };
function searchBig(f: boolean): CSSProperties {
  return { display: "flex", alignItems: "center", gap: 12, background: "var(--paper)", border: `1.5px solid ${f ? "var(--blue-500)" : "var(--line)"}`, boxShadow: f ? "0 0 0 4px oklch(0.62 0.16 243 / 0.12)" : "var(--shadow-sm)", borderRadius: 12, padding: "0 18px", height: 56 };
}
function chipStyle(active: boolean): CSSProperties {
  return { padding: "10px 14px", borderRadius: 10, fontSize: 13, fontWeight: 500, border: `1.5px solid ${active ? "var(--navy-900)" : "var(--line)"}`, background: active ? "var(--navy-900)" : "var(--paper)", color: active ? "white" : "var(--ink-700)", cursor: "pointer", height: 44, display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap" };
}
const listCard: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow-sm)", overflow: "hidden" };
const listHead: CSSProperties = { padding: "14px 18px", borderBottom: "1px solid var(--line-2)", display: "flex", justifyContent: "space-between", fontSize: 13.5, color: "var(--ink-500)", background: "oklch(0.985 0.008 245)" };
function row(active: boolean): CSSProperties {
  return { padding: "14px 18px 14px 15px", display: "grid", gridTemplateColumns: "40px 1fr auto", gap: 14, alignItems: "center", cursor: "pointer", borderBottom: "1px solid var(--line-2)", background: active ? "var(--blue-50)" : "transparent", borderLeft: `3px solid ${active ? "var(--blue-600)" : "transparent"}` };
}
function ava(color: string): CSSProperties {
  return { width: 40, height: 40, borderRadius: "50%", background: color, color: "white", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 600 };
}
const panel: CSSProperties = { background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 16, boxShadow: "var(--shadow)", overflow: "hidden", position: "sticky", top: 84 };
const pHead: CSSProperties = { padding: "20px 22px 18px", background: "linear-gradient(180deg, var(--navy-950), var(--navy-800))", color: "white" };
const pAva: CSSProperties = { width: 44, height: 44, borderRadius: "50%", background: "oklch(1 0 0 / 0.15)", border: "1.5px solid oklch(1 0 0 / 0.20)", color: "white", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 600 };
const pBadge: CSSProperties = { display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 9px", borderRadius: 999, background: "oklch(1 0 0 / 0.10)", border: "1px solid oklch(1 0 0 / 0.14)", fontSize: 11.5, fontWeight: 500, color: "white" };
function pStat(kind: string): CSSProperties {
  const pal = {
    aldia: ["oklch(0.62 0.13 155 / 0.20)", "oklch(0.92 0.08 155)"],
    encurso: ["oklch(0.62 0.16 243 / 0.20)", "oklch(0.92 0.04 240)"],
    morosa: ["oklch(0.62 0.17 28 / 0.22)", "oklch(0.92 0.06 28)"],
  }[kind] ?? ["oklch(1 0 0 / 0.10)", "white"];
  return { display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px", borderRadius: 999, background: pal[0], color: pal[1], fontSize: 11.5, fontWeight: 600, border: "1px solid oklch(1 0 0 / 0.10)", flexShrink: 0 };
}
const infoGrid: CSSProperties = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px 18px", paddingBottom: 18, borderBottom: "1px solid var(--line-2)" };
const iL: CSSProperties = { fontSize: 11.5, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 2 };
const iV: CSSProperties = { fontSize: 13.5, color: "var(--ink-900)", fontWeight: 500 };
const sectionTitle: CSSProperties = { fontSize: 12, fontWeight: 600, color: "var(--ink-500)", textTransform: "uppercase", letterSpacing: "0.10em", margin: "18px 0 10px", display: "flex", justifyContent: "space-between", alignItems: "center" };
function cuotaItem(estado: number): CSSProperties {
  const borde = estado === 1 ? "var(--ok-500)" : estado === 2 ? "var(--bad-500)" : "var(--blue-500)";
  return { display: "grid", gridTemplateColumns: "44px 1fr auto auto", gap: 14, alignItems: "center", padding: "12px 14px", background: "var(--paper)", border: "1px solid var(--line)", borderLeft: `3px solid ${borde}`, borderRadius: 10, marginBottom: 8 };
}
const cuotaNBox: CSSProperties = { width: 36, height: 36, borderRadius: 9, background: "oklch(0.97 0.012 245)", color: "var(--ink-700)", display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, fontFamily: "'JetBrains Mono', monospace" };
function pillEstado(estado: number): CSSProperties {
  const pal = estado === 1 ? ["var(--ok-100)", "var(--ok-700)"] : estado === 2 ? ["var(--bad-100)", "var(--bad-700)"] : ["var(--blue-100)", "var(--navy-900)"];
  return { display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 10px", borderRadius: 999, fontSize: 11.5, fontWeight: 600, background: pal[0], color: pal[1] };
}
const payBtn: CSSProperties = { height: 34, padding: "0 14px", borderRadius: 8, background: "var(--navy-900)", color: "white", border: 0, cursor: "pointer", fontSize: 12.5, fontWeight: 600 };
const pFoot: CSSProperties = { padding: "18px 22px 22px", borderTop: "1px solid var(--line-2)", background: "oklch(0.985 0.008 245)" };
function renewBtn(enabled: boolean): CSSProperties {
  return { width: "100%", height: 48, padding: "0 18px", borderRadius: 12, background: enabled ? "linear-gradient(180deg, var(--blue-600), var(--navy-800))" : "oklch(0.94 0.012 245)", color: enabled ? "white" : "var(--ink-400)", border: 0, cursor: enabled ? "pointer" : "not-allowed", fontSize: 15, fontWeight: 600, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, boxShadow: enabled ? "0 8px 24px -10px oklch(0.30 0.10 250 / 0.45)" : "none" };
}
