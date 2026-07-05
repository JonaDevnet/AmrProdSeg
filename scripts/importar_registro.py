# -*- coding: utf-8 -*-
"""
Importador de cartera desde los Excel de registro (Mateo / Franco Rinaldi).

Lee registroClientesMateoRinaldi.xlsm y registroCLientesFrancoRinaldi.xlsm
(en la raíz del proyecto) y genera ImportRegistroAMR.sql, un script SQL
idempotente que crea Clientes, Vehículos, Pólizas y sus Cuotas (Cobros).

Reglas:
- Duplicados (misma patente, o mismo DNI+póliza si no hay patente): se conserva
  el registro VIGENTE = el de PROX PAGO más reciente.
- CUOTA "n/m" → cuota n de m. "n" solo → total 3 (mínimo n). Fracciones de
  Excel (0.25 = 1/4) y rangos ("1 A 3") se interpretan.
- Cuotas anteriores a la actual quedan PAGADAS; la actual vence en PROX PAGO
  (VENCIDA si ya pasó); las posteriores, mensuales.
- Vendedor: se resuelve por nombre en la base al ejecutar el SQL
  (LIKE %mateo% / %franco%), con fallback al primer Admin.
- Compañías: se normalizan los ~40 typos a las 7 reales; se crean si faltan.

Uso:  python scripts/importar_registro.py
Luego: sqlcmd -i ImportRegistroAMR.sql   (local o en el VPS vía docker exec)
"""
import openpyxl, re, sys, os
from datetime import datetime, date, timedelta
from collections import defaultdict

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOY = date.today()

ARCHIVOS = [
    # (archivo, hoja, vendedor_tag, índices 0-based de columnas)
    ("registroClientesMateoRinaldi.xlsm", "REGISTRO", "mateo",
     dict(prox=1, cia=2, cuota=3, valor=4, poliza=5, nombre=6, dni=11, dom=12,
          tel=13, bien=14, patente=15, anio=16, motor=17, chasis=18, gnc=19, cobertura=None)),
    ("registroCLientesFrancoRinaldi.xlsm", "REGISTRO2", "franco",
     dict(prox=1, cia=2, cuota=3, valor=4, poliza=5, nombre=6, dni=9, dom=10,
          tel=11, bien=12, patente=13, anio=14, motor=15, chasis=16, gnc=17, cobertura=18)),
]

# Vendedor → subconsulta SQL (se resuelve en la base destino al ejecutar)
VEND_SQL = {
    "mateo":  "(SELECT TOP 1 Id FROM Usuarios WHERE Nombre COLLATE Latin1_General_CI_AI LIKE N'%mateo%')",
    "franco": "(SELECT TOP 1 Id FROM Usuarios WHERE Nombre COLLATE Latin1_General_CI_AI LIKE N'%franco%')",
}
VEND_FALLBACK = "(SELECT MIN(Id) FROM Usuarios WHERE Rol = 'Admin')"

# Compañías: clave canónica → (patrón LIKE para buscar en la base, nombre si hay que crearla)
CIAS = {
    "NRE":      ("%NRE%",       "NRE Cia Seguros"),
    "PERSEVER": ("%ersev%",     "La Perseverancia Seguros"),
    "ATM":      ("%ATM%",       "ATM Seguros"),
    "AGRO":     ("%AGROSALTA%", "Agrosalta Coop Seg"),
    "LIBRA":    ("%LIBRA%",     "Libra Seguros"),
    "PARANA":   ("%PARANA%",    "Parana Seguros"),
    "TPC":      ("%TPC%",       "TPC Cia de Seguros"),
}

def canon_cia(raw):
    s = re.sub(r"[^A-Z]", "", str(raw or "").upper())
    if "NRE" in s: return "NRE"
    if "ATM" in s: return "ATM"
    if "AGROSALTA" in s: return "AGRO"
    if "LIBRA" in s: return "LIBRA"
    if "PARANA" in s: return "PARANA"
    if "TPC" in s: return "TPC"
    if "ERANCIA" in s or "PERSEV" in s or "PESEV" in s or "PERSERV" in s: return "PERSEVER"
    return "PERSEVER" if not s else None  # vacío → la más común; desconocida → None (se reporta)

def parse_cuota(v):
    """→ (n, m): cuota actual n de m."""
    if v is None: return (1, 3)
    if isinstance(v, datetime): return (1, 3)          # celda mal tipeada como fecha
    if isinstance(v, (int, float)):
        f = float(v)
        if 0 < f < 1:                                   # Excel convirtió "1/4" en 0.25
            m = round(1 / f); return (1, max(2, min(m, 24)))
        n = int(f); n = max(1, n); return (n, max(n, 3))
    s = str(v).strip().upper()
    if not s or s in ("NONE", "0"): return (1, 3)
    m_ = re.match(r"^(\d+)\s*/\s*(\d+)$", s)
    if m_: n, m = int(m_.group(1)), int(m_.group(2))
    else:
        m_ = re.match(r"^(\d+)\s*DE\s*(\d+)$", s)
        if m_: n, m = int(m_.group(1)), int(m_.group(2))
        else:
            nums = [int(x) for x in re.findall(r"\d+", s)]
            if not nums: return (1, 3)
            n, m = min(nums), max(max(nums), 3)         # "1 A 3", "2 Y 3", etc.
    n = max(1, n); m = max(2, min(m, 24)); n = min(n, m)
    return (n, m)

def parse_valor(v):
    if v is None: return 0.0
    if isinstance(v, (int, float)): return max(0.0, float(v))
    s = re.sub(r"[^\d,.]", "", str(v)).replace(".", "").replace(",", ".")
    try: return max(0.0, float(s))
    except ValueError: return 0.0

def combustion(v):
    s = str(v or "").strip().upper()
    if not s: return None
    if "DIESEL" in s or "DISEL" in s: return "Diesel"
    if "GNC" in s or s.startswith("SI"): return "GNC"
    if "NAF" in s: return "Nafta"
    return None    # "NO POSEE" y variantes: combustible desconocido

def limpio(v, maxlen):
    s = str(v or "").replace("\xa0", " ").strip()
    s = re.sub(r"\s+", " ", s)
    return s[:maxlen]

def sql_str(v):
    return "N'" + str(v).replace("'", "''") + "'"

def add_months(d, meses):
    mth = d.month - 1 + meses
    y, mth = d.year + mth // 12, mth % 12 + 1
    dia = min(d.day, [31, 29 if y % 4 == 0 and (y % 100 != 0 or y % 400 == 0) else 28,
                      31, 30, 31, 30, 31, 31, 30, 31, 30, 31][mth - 1])
    return date(y, mth, dia)

# ─────────────────────────── 1. Leer y normalizar ───────────────────────────
registros = []
descartes = {"sin_fecha": 0, "cia_desconocida": 0, "fecha_rara": 0}
sd_seq = 0

for archivo, hoja, vend, c in ARCHIVOS:
    wb = openpyxl.load_workbook(os.path.join(RAIZ, archivo), data_only=True)
    ws = wb[hoja]
    for row in ws.iter_rows(max_col=21):
        v = [cell.value for cell in row]
        nombre = limpio(v[c["nombre"]], 150)
        if not nombre or nombre.upper().startswith("APELLIDO"):
            continue
        prox = v[c["prox"]]
        if not isinstance(prox, datetime):
            descartes["sin_fecha"] += 1; continue
        if prox.year < 1990 or prox.year > 2100:
            descartes["fecha_rara"] += 1; continue
        cia = canon_cia(v[c["cia"]])
        if cia is None:
            descartes["cia_desconocida"] += 1; continue

        dni = re.sub(r"\D", "", str(v[c["dni"]] or ""))[:20]
        patente = re.sub(r"[^A-Z0-9]", "", str(v[c["patente"]] or "").upper())[:10] or None
        if not dni:
            sd_seq += 1
            dni = f"SD{patente or sd_seq:>06}"          # cliente sin documento

        n, m = parse_cuota(v[c["cuota"]])
        bien = limpio(v[c["bien"]], 120)
        partes = bien.split(" ", 1)
        anio_raw = v[c["anio"]]
        try: anio = int(float(str(anio_raw))) if anio_raw else 0
        except (ValueError, TypeError): anio = 0

        registros.append(dict(
            vend=vend, prox=prox.date(), cia=cia,
            n=n, m=m, valor=parse_valor(v[c["valor"]]),
            numero=limpio(v[c["poliza"]], 20),
            nombre=nombre, dni=dni,
            dom=limpio(v[c["dom"]], 200), tel=limpio(v[c["tel"]], 30),
            marca=(partes[0] or "-")[:60], modelo=(partes[1] if len(partes) > 1 else "-")[:60],
            patente=patente, anio=anio if 1900 <= anio <= 2100 else 0,
            motor=limpio(v[c["motor"]], 50), chasis=limpio(v[c["chasis"]], 50),
            comb=combustion(v[c["gnc"]]),
            cobertura=limpio(v[c["cobertura"]], 100) if c["cobertura"] is not None else "",
        ))

# ─────────────────── 2. Deduplicar: queda el más VIGENTE ────────────────────
por_clave = {}
for r in registros:
    clave = ("PAT", r["patente"]) if r["patente"] else ("DNIPOL", r["dni"], r["numero"])
    prev = por_clave.get(clave)
    if prev is None or r["prox"] > prev["prox"]:
        por_clave[clave] = r
finales = list(por_clave.values())

# Números de póliza únicos (los vacíos se generan)
usados = set(); seq = 0
for r in finales:
    num = r["numero"]
    if not num:
        seq += 1; num = f"S/N-{seq:05d}"
    base, k = num, 2
    while num.upper() in usados:
        num = f"{base}-{k}"[:20]; k += 1
    usados.add(num.upper()); r["numero"] = num

# ─────────────────────────── 3. Generar el SQL ──────────────────────────────
out = [
    "/* ImportRegistroAMR.sql — generado por scripts/importar_registro.py",
    f"   Fecha: {datetime.now():%Y-%m-%d %H:%M} · Registros: {len(finales)} (de {len(registros)} filas leídas)",
    "   Idempotente: las pólizas ya importadas (mismo Número) se saltean. */",
    "SET NOCOUNT ON;", "GO", "",
    "-- Compañías (se crean si no existen)",
]
for clave, (patron, nombre) in CIAS.items():
    out.append(f"IF NOT EXISTS (SELECT 1 FROM Companias WHERE UPPER(Nombre) LIKE N'{patron.upper()}')")
    out.append(f"    INSERT INTO Companias (Nombre, Activo) VALUES ({sql_str(nombre)}, 1);")
out.append("GO"); out.append("")

for i, r in enumerate(finales, 1):
    venc1 = add_months(r["prox"], -(r["n"] - 1))            # vencimiento de la cuota 1
    ini = add_months(venc1, -1)
    fin = add_months(ini, r["m"])
    estado_pol = 0 if fin >= HOY else 1
    vend_sql = f"ISNULL({VEND_SQL[r['vend']]}, {VEND_FALLBACK})"
    cia_sql = f"(SELECT TOP 1 Id FROM Companias WHERE UPPER(Nombre) LIKE N'{CIAS[r['cia']][0].upper()}' ORDER BY Id)"
    tipo_doc = "CUIT" if len(r["dni"]) == 11 else "DNI"

    cuotas_vals = []
    for k in range(1, r["m"] + 1):
        vk = add_months(r["prox"], k - r["n"])
        if k < r["n"]:
            estado, fpago = 1, f"'{vk:%Y-%m-%d}T12:00:00'"
        else:
            estado, fpago = (2 if vk < HOY else 0), "NULL"
        cuotas_vals.append(f"(@pol, {k}, '{vk:%Y-%m-%d}', {r['valor']:.2f}, {estado}, {fpago}, @vend)")

    out.append(f"-- [{i}] {r['nombre']} · {r['dni']} · {r['patente'] or 's/patente'} · {r['numero']}")
    out.append(f"IF NOT EXISTS (SELECT 1 FROM Polizas WHERE Numero = {sql_str(r['numero'])})")
    out.append("BEGIN")
    out.append(f"    DECLARE @vend INT = {vend_sql};")
    out.append(f"    DECLARE @cli INT = (SELECT TOP 1 Id FROM Clientes WHERE Documento = {sql_str(r['dni'])});")
    out.append("    IF @cli IS NULL BEGIN")
    out.append(f"        INSERT INTO Clientes (Nombre, Documento, TipoDocumento, Telefono, Direccion, FechaAlta, Activo, VendedorId)")
    out.append(f"        VALUES ({sql_str(r['nombre'])}, {sql_str(r['dni'])}, '{tipo_doc}', {sql_str(r['tel'])}, {sql_str(r['dom'])}, GETUTCDATE(), 1, @vend);")
    out.append("        SET @cli = SCOPE_IDENTITY(); END")
    out.append("    DECLARE @veh INT = NULL;")
    if r["patente"]:
        comb = sql_str(r["comb"]) if r["comb"] else "NULL"
        out.append(f"    SET @veh = (SELECT TOP 1 Id FROM Vehiculos WHERE Patente = {sql_str(r['patente'])});")
        out.append("    IF @veh IS NULL BEGIN")
        out.append(f"        INSERT INTO Vehiculos (ClienteId, Marca, Modelo, Anio, Patente, Chasis, Motor, Combustion)")
        out.append(f"        VALUES (@cli, {sql_str(r['marca'])}, {sql_str(r['modelo'])}, {r['anio']}, {sql_str(r['patente'])}, {sql_str(r['chasis'])}, {sql_str(r['motor'])}, {comb});")
        out.append("        SET @veh = SCOPE_IDENTITY(); END")
        out.append("    ELSE IF (SELECT ClienteId FROM Vehiculos WHERE Id = @veh) <> @cli SET @veh = NULL;")
    cobertura = sql_str(r["cobertura"]) if r["cobertura"] else "NULL"
    out.append(f"    INSERT INTO Polizas (Numero, ClienteId, VehiculoId, CompaniaId, FechaInicio, FechaFin, PrecioTotal, CantidadCuotas, Estado, FechaEmision, VendedorId, Cobertura)")
    out.append(f"    VALUES ({sql_str(r['numero'])}, @cli, @veh, {cia_sql}, '{ini:%Y-%m-%d}', '{fin:%Y-%m-%d}', {r['valor'] * r['m']:.2f}, {r['m']}, {estado_pol}, '{ini:%Y-%m-%d}', @vend, {cobertura});")
    out.append("    DECLARE @pol INT = SCOPE_IDENTITY();")
    out.append("    INSERT INTO Cobros (PolizaId, NumeroCuota, FechaVencimiento, Monto, Estado, FechaPago, RegistradoPor)")
    out.append("    VALUES " + ",\n           ".join(cuotas_vals) + ";")
    out.append("END")
    out.append("GO")

out.append("PRINT 'Importación terminada.';")
out.append("SELECT 'Clientes' AS Tabla, COUNT(*) AS Total FROM Clientes")
out.append("UNION ALL SELECT 'Vehiculos', COUNT(*) FROM Vehiculos")
out.append("UNION ALL SELECT 'Polizas', COUNT(*) FROM Polizas")
out.append("UNION ALL SELECT 'Cobros', COUNT(*) FROM Cobros;")
out.append("GO")

destino = os.path.join(RAIZ, "ImportRegistroAMR.sql")
with open(destino, "w", encoding="utf-8-sig") as f:
    f.write("\n".join(out))

# ─────────────────────────── 4. Resumen ─────────────────────────────────────
vig = sum(1 for r in finales if add_months(add_months(r["prox"], -(r["n"] - 1)), r["m"] - 1) >= HOY)
print(f"Filas leídas:        {len(registros)}")
print(f"Descartes:           {descartes}")
print(f"Registros finales:   {len(finales)}  (duplicados resueltos: {len(registros) - len(finales)})")
print(f"  · de Mateo:        {sum(1 for r in finales if r['vend'] == 'mateo')}")
print(f"  · de Franco:       {sum(1 for r in finales if r['vend'] == 'franco')}")
print(f"Clientes únicos:     {len(set(r['dni'] for r in finales))}")
print(f"Con vehículo:        {sum(1 for r in finales if r['patente'])}")
print(f"Sin valor de cuota:  {sum(1 for r in finales if r['valor'] == 0)}")
print(f"SQL generado en:     {destino}")
