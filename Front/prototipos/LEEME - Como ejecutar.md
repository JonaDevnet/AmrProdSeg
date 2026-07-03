# AMR Seguros — Guía para ejecutar en tu computadora

Esta es una aplicación web hecha con **HTML + React (vía Babel en el navegador)**.
No necesita compilarse, pero **sí necesita un servidor local** para funcionar
(no alcanza con hacer doble clic en el archivo).

## Por qué hace falta un servidor

El archivo `AMR Seguros.html` carga los demás archivos `.jsx` con etiquetas
`<script src="...">`. Si abrís el HTML directamente (`file://`), el navegador
bloquea esa carga por seguridad y verás una pantalla en blanco. Un servidor local
soluciona esto.

---

## Opción A — Rápida (sin instalar nada, si tenés Python)

1. Abrí una terminal **dentro de la carpeta del proyecto** (donde está `AMR Seguros.html`).
2. Ejecutá:
   ```bash
   python3 -m http.server 8000
   ```
3. Abrí en el navegador: **http://localhost:8000/AMR%20Seguros.html**

Para detener el servidor: `Ctrl + C` en la terminal.

---

## Opción B — Con Node.js

1. En la terminal, dentro de la carpeta:
   ```bash
   npx serve
   ```
2. Abrí la URL que te muestra (normalmente `http://localhost:3000`) y entrá a
   `AMR Seguros.html`.

---

## Cómo usarlo con Claude Code

1. Descomprimí el `.zip` en una carpeta de tu computadora.
2. Abrí esa carpeta con Claude Code:
   ```bash
   cd ruta/a/la/carpeta
   claude
   ```
3. Pedile a Claude Code lo que necesites, por ejemplo:
   - *"Levantá un servidor local y abrí la app"*
   - *"Agregá validación a los campos obligatorios de Nueva Póliza"*
   - *"Conectá el atajo ⌘K al buscador"*

Claude Code puede leer todos estos archivos, levantarte el servidor y seguir
modificando la app desde tu máquina.

---

## Estructura de archivos

| Archivo | Qué contiene |
|---|---|
| `AMR Seguros.html` | Punto de entrada. Carga React, Babel y todos los `.jsx`. |
| `amr_app.jsx` | Enrutador principal (login → dashboard → secciones). |
| `amr_login.jsx` | Pantalla de inicio de sesión. |
| `amr_navbar.jsx` | Barra superior, notificaciones, menú de usuario, modal de compañías. |
| `amr_dashboard.jsx` | Cartera de clientes, búsqueda, ficha, paginación. |
| `amr_nueva_poliza.jsx` | Wizard de alta de póliza. |
| `amr_editar.jsx` | Edición / asignación de número de póliza. |
| `amr_cobranzas.jsx` | Cobro de cuotas, comprobantes, anulaciones, renovación. |
| `amr_bajas.jsx` | Carga y gestión de bajas / altas. |
| `amr_reportes.jsx` | Reportes y exportación a Excel. |
| `amr_vendedores.jsx` | Gestión de vendedores y permisos. |
| `amr_companias.jsx` | Modal para administrar compañías aseguradoras. |
| `amr_icons.jsx` | Íconos SVG compartidos. |

## Notas

- Los datos se guardan en el **localStorage del navegador** (pólizas nuevas,
  compañías, anulaciones, vendedores). Son locales a tu navegador; no hay base de
  datos externa.
- Requiere **conexión a internet** la primera vez, porque React, Babel y la
  librería de Excel se cargan desde un CDN.
- Para que sea un único archivo portable sin servidor, se puede generar una
  versión "todo en uno"; pedímelo si lo necesitás.
