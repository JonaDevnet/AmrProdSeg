# REVERTIR — Inicio de póliza libre (sin restricción de fecha)

**Cambio temporal.** Se quitó la validación que exigía que la **fecha de inicio** de la póliza
fuera **igual o posterior a hoy** (`FechaInicio >= DateTime.Today`), tanto en el **Alta** como en
la **creación normal de póliza**. Ahora la fecha de inicio se puede elegir libremente (incluido
el pasado).

- Se mantiene **toda** la lógica de **cuotas y vigencia** sin cambios:
  - `fechaFin` = `inicio` + período elegido ("12 meses (anual)", etc.).
  - 1ª cuota = `inicio` + 1 mes; las siguientes, +1 mes cada una.
- **No** se modificó la **edición** de póliza (no tenía esta restricción).
- El **frontend** (`Front/src/pages/Alta.tsx`, input de inicio ≈ línea 603) **nunca** tuvo
  restricción (`min`): el bloqueo real era del backend.

---

## Qué se cambió

Archivo único: `Back/AmrProdSeg.API/Application/Validators/Validators.cs`

### 1) `CrearPolizaValidator` (creación normal de póliza)

Se **eliminó** este bloque (estaba en las líneas **97-99**), justo antes de la regla de `FechaFin`:

```csharp
        RuleFor(x => x.FechaInicio)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("La fecha de inicio no puede ser anterior a hoy.");
```

### 2) `AltaAseguradoValidator` (Alta)

Se **eliminó** este bloque (estaba en las líneas **132-134**), justo antes de la regla de `FechaFin`:

```csharp
        RuleFor(x => x.FechaInicio)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("La fecha de inicio no puede ser anterior a hoy.");
```

En ambos casos queda la regla de vigencia (sin cambios):

```csharp
        RuleFor(x => x.FechaFin)
            .GreaterThan(x => x.FechaInicio)
            .WithMessage("La fecha de fin debe ser posterior a la de inicio.");
```

---

## Cómo revertir

En `Back/AmrProdSeg.API/Application/Validators/Validators.cs`, dentro de **cada** uno de los dos
validadores (`CrearPolizaValidator` y `AltaAseguradoValidator`), **reinsertar** el bloque
`FechaInicio` inmediatamente **antes** de la regla `RuleFor(x => x.FechaFin)`:

```csharp
        RuleFor(x => x.FechaInicio)
            .GreaterThanOrEqualTo(_ => DateTime.Today)
            .WithMessage("La fecha de inicio no puede ser anterior a hoy.");
```

Y quitar el comentario marcador `// TEMPORAL: inicio de póliza libre ...`.

> Nota: los números de línea de arriba corresponden al estado **antes** de este cambio; al
> reinsertar el bloque, las líneas posteriores se corren. Ubicalo por el contexto (antes de
> `FechaFin`) y no por el número exacto.
