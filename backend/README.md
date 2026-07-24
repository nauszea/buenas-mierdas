# 🗄️ El altar de verdad: Pocketbase en tu laptop

Pocketbase es la "memoria" del altar: guarda los `.glb`, las historias y las
reapropiaciones **en tu propia computadora** (nada de nubes corporativas).
Es UN solo archivo `.exe` — no instala nada raro.

**La app funciona sin esto** (modo ensayo: guarda en el navegador), pero los
modelos 3D subidos solo sobreviven mientras la pestaña esté abierta. Con
Pocketbase encendido, todo se guarda para siempre y automáticamente.

## Instalación (Windows, una sola vez)

1. Entra a **https://pocketbase.io/docs/** y descarga la versión
   **Windows amd64** (un ZIP chiquito, ~10 MB).
2. Descomprime el ZIP y copia el archivo **`pocketbase.exe`** a esta carpeta
   (`buenas-mierdas/backend/`).
3. Abre una ventana negra AQUÍ (en el Explorador, con esta carpeta abierta,
   clic en la barra de dirección → escribe `cmd` → Enter) y escribe:

   ```
   pocketbase serve
   ```

4. La primera vez te dará un link tipo
   `http://127.0.0.1:8090/_/` con un token — ábrelo en el navegador y crea
   tu usuario administrador (correo + contraseña que tú quieras).
5. En el panel de administración: **Settings → Import collections →**
   pega el contenido del archivo `pb_schema.json` (está en esta carpeta,
   ábrelo con el Bloc de notas y copia todo) → **Review → Confirm**.

Listo. Ya existe la colección `afectos`.

## Uso diario (2 ventanas negras)

| Ventana | Dónde | Comando |
|---|---|---|
| 1 — el altar (backend) | `buenas-mierdas/backend/` | `pocketbase serve` |
| 2 — la web (frontend) | `buenas-mierdas/` | `npm run dev` |

La web detecta sola si Pocketbase está encendido: si lo está, todo lo que se
sube por "⬆ Subir un afecto" queda guardado de verdad (puedes verlo también
en el panel `http://127.0.0.1:8090/_/`, colección `afectos`).

## Notas

- Los datos viven en `backend/pb_data/` (se crea sola). **No se versiona en
  git** — es el archivo vivo del altar, respáldala tú de vez en cuando
  copiándola a un USB. 💾
- Las reglas de la colección están abiertas (cualquiera con acceso a la web
  puede crear y reapropiar) — coherente con el proyecto. La moderación de
  textos llega en la Fase 6.
- En la Fase 6, Cloudflare Tunnel expondrá esta misma laptop al internet
  para que cualquiera visite el altar.
